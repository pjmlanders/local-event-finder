import { searchTicketmaster } from './ticketmaster.service.js'
import { searchSeatgeek } from './seatgeek.service.js'
import { logger } from '../utils/logger.js'
import type { UnifiedEvent, SourceBreakdown } from 'shared'

interface AggregatedSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  eventType?: string
  classificationName?: string
  startDateTime?: string
  endDateTime?: string
  page: number
  size: number
  sort: string
}

// ─── Deduplication Engine ────────────────────────────────────────────

/**
 * Normalize a string for fuzzy comparison: lowercase, remove punctuation,
 * collapse whitespace, strip common noise words.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an|at|in|on|of|and|or|live|tour|tickets?|presents?|featuring|feat|ft)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract a compact fingerprint from a name — first 4 significant words sorted.
 * Catches reorderings like "John Legend Live" vs "Live: John Legend".
 */
function fingerprint(str: string): string {
  const words = normalize(str).split(' ').filter(w => w.length > 1)
  return words.sort().slice(0, 4).join(' ')
}

/**
 * Levenshtein-based edit-distance similarity (0–1).
 */
function editSimilarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (na.length === 0 || nb.length === 0) return 0

  const lenRatio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length)
  if (lenRatio < 0.4) return lenRatio * 0.5

  const len = Math.max(na.length, nb.length)
  if (len > 120) return wordSimilarity(a, b)

  const matrix: number[][] = []
  for (let i = 0; i <= na.length; i++) {
    matrix[i] = [i]
    for (let j = 1; j <= nb.length; j++) {
      if (i === 0) {
        matrix[i][j] = j
      } else {
        const cost = na[i - 1] === nb[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        )
      }
    }
  }
  return 1 - matrix[na.length][nb.length] / len
}

/**
 * Word-overlap similarity (Jaccard index).
 */
function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 1))
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 1))
  if (wordsA.size === 0 && wordsB.size === 0) return 1

  let intersection = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++
  }
  const union = new Set([...wordsA, ...wordsB]).size
  return union > 0 ? intersection / union : 0
}

/**
 * Substring containment — if one name fully contains the other after normalization.
 */
function containsOther(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  if (na.length < 4 || nb.length < 4) return false
  return na.includes(nb) || nb.includes(na)
}

/**
 * Haversine distance in miles between two coordinates.
 */
function geoDistanceMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Multi-signal duplicate detection.
 */
function isDuplicate(a: UnifiedEvent, b: UnifiedEvent): boolean {
  if (a.startDate !== b.startDate) return false

  const nameEdit = editSimilarity(a.name, b.name)
  const nameWords = wordSimilarity(a.name, b.name)
  const fpMatch = fingerprint(a.name) === fingerprint(b.name) && fingerprint(a.name).length > 3
  const nameContains = containsOther(a.name, b.name)

  // Signal 1: Strong name match + same general area (within 5 miles)
  if (nameEdit >= 0.70 || nameWords >= 0.60 || fpMatch || nameContains) {
    const dist = geoDistanceMi(
      a.venue.latitude, a.venue.longitude,
      b.venue.latitude, b.venue.longitude,
    )
    if (dist <= 5) return true
  }

  // Signal 2: Same venue + partial name match
  const venueSim = editSimilarity(a.venue.name, b.venue.name)
  if (venueSim >= 0.70 && (nameEdit >= 0.35 || nameWords >= 0.30)) return true

  // Signal 3: Very close venues + moderate name match
  const venueDist = geoDistanceMi(
    a.venue.latitude, a.venue.longitude,
    b.venue.latitude, b.venue.longitude,
  )
  if (venueDist <= 0.3 && (nameEdit >= 0.55 || nameWords >= 0.45)) return true

  return false
}

// ─── Source Priority for Duplicate Resolution ────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  ticketmaster: 3,
  seatgeek: 2,
  web: 1,
}

function pickBestEvent(a: UnifiedEvent, b: UnifiedEvent): UnifiedEvent {
  const priorityA = SOURCE_PRIORITY[a.source] ?? 0
  const priorityB = SOURCE_PRIORITY[b.source] ?? 0
  if (priorityA !== priorityB) return priorityA > priorityB ? a : b

  let scoreA = 0
  let scoreB = 0
  if (a.imageUrl) scoreA++
  if (b.imageUrl) scoreB++
  if (a.priceRange) scoreA++
  if (b.priceRange) scoreB++
  if (a.description) scoreA++
  if (b.description) scoreB++
  if (a.startTime) scoreA++
  if (b.startTime) scoreB++

  return scoreA >= scoreB ? a : b
}

/**
 * Merge events from multiple sources, removing duplicates.
 */
function deduplicateAllSources(eventsBySource: UnifiedEvent[][]): {
  events: UnifiedEvent[]
  duplicatesRemoved: number
} {
  const allEvents = eventsBySource.flat()
  const kept: UnifiedEvent[] = []
  const removed = new Set<number>()

  for (let i = 0; i < allEvents.length; i++) {
    if (removed.has(i)) continue

    let best = allEvents[i]

    for (let j = i + 1; j < allEvents.length; j++) {
      if (removed.has(j)) continue

      if (isDuplicate(best, allEvents[j])) {
        const winner = pickBestEvent(best, allEvents[j])
        if (winner === allEvents[j]) {
          removed.add(i)
          best = allEvents[j]
        }
        removed.add(j)
      }
    }

    if (!removed.has(i)) {
      kept.push(best)
    }
  }

  const dupCount = removed.size
  if (dupCount > 0) {
    logger.info({ duplicatesRemoved: dupCount, keptCount: kept.length }, 'Deduplication complete')
  }

  return { events: kept, duplicatesRemoved: dupCount }
}

// ─── Sort ────────────────────────────────────────────────────────────

function sortEvents(events: UnifiedEvent[], sort: string): UnifiedEvent[] {
  return [...events].sort((a, b) => {
    switch (sort) {
      case 'date':
        return a.startDate.localeCompare(b.startDate) ||
          (a.startTime ?? '').localeCompare(b.startTime ?? '')
      case 'name':
        return a.name.localeCompare(b.name)
      case 'relevance':
        return (b.popularity ?? 0) - (a.popularity ?? 0)
      default:
        return 0
    }
  })
}

// ─── Main Aggregator ─────────────────────────────────────────────────

const MAX_FETCH_SIZE = 200

/**
 * Fetch enough events from all sources to fill the requested page, then
 * merge, dedupe, sort, and slice to that page. Total is the deduplicated
 * count (so "X events found" matches what we have).
 */
export async function searchAllSources(params: AggregatedSearchParams): Promise<{
  events: UnifiedEvent[]
  total: number
  sources: SourceBreakdown
}> {
  const fetchSize = Math.min((params.page + 1) * params.size, MAX_FETCH_SIZE)

  const [tmResult, sgResult] = await Promise.all([
    searchTicketmaster({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      keyword: params.keyword,
      classificationName: params.classificationName,
      startDateTime: params.startDateTime,
      endDateTime: params.endDateTime,
      page: 0,
      size: fetchSize,
      sort: params.sort,
    }),
    searchSeatgeek({
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      keyword: params.keyword,
      type: params.eventType,
      startDateTime: params.startDateTime,
      endDateTime: params.endDateTime,
      page: 0,
      size: fetchSize,
      sort: params.sort,
    }),
  ])

  logger.info(
    { ticketmaster: tmResult.events.length, seatgeek: sgResult.events.length },
    'Raw results from all sources',
  )

  const { events: deduped, duplicatesRemoved } = deduplicateAllSources([
    tmResult.events,
    sgResult.events,
  ])

  const sorted = sortEvents(deduped, params.sort)
  const start = params.page * params.size
  const paged = sorted.slice(start, start + params.size)

  return {
    events: paged,
    total: deduped.length,
    sources: {
      ticketmaster: tmResult.events.length,
      seatgeek: sgResult.events.length,
      duplicatesRemoved,
    },
  }
}
