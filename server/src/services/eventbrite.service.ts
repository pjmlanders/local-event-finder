import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { mapEventbriteEvent } from '../utils/mapEventbrite.js'
import type { EbSearchResponse, EbEvent } from '../types/eventbrite.types.js'
import type { UnifiedEvent } from 'shared'

const BASE_URL = 'https://www.eventbriteapi.com/v3'

// Maps our EventType to Eventbrite category IDs
const EVENT_TYPE_TO_EB_CATEGORIES: Record<string, string[]> = {
  music:   ['103'],
  theatre: ['105'],
  musical: ['105'],
  comedy:  ['105'],       // comedy lives under Performing & Visual Arts
  family:  ['115'],
  film:    ['104'],
  sports:  ['108'],
}

interface EventbriteSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  eventType?: string
  startDateTime?: string
  endDateTime?: string
  page: number
  size: number
}

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.EVENTBRITE_API_KEY}`,
    Accept: 'application/json',
  }
}

// Eventbrite deprecated their public Discovery API in 2024 — it now requires
// an approved Distribution Partner account. The key may be valid but the
// /events/search/ endpoint returns 404 for standard accounts.
// When this is true we skip the API call to avoid noisy 404 errors.
let ebDiscoveryUnavailable = false

export async function searchEventbrite(params: EventbriteSearchParams): Promise<{
  events: UnifiedEvent[]
  total: number
}> {
  if (!env.EVENTBRITE_API_KEY) {
    logger.debug('EVENTBRITE_API_KEY not configured, skipping Eventbrite search')
    return { events: [], total: 0 }
  }

  if (ebDiscoveryUnavailable) {
    return { events: [], total: 0 }
  }

  const url = new URL(`${BASE_URL}/events/search/`)
  url.searchParams.set('location.latitude', String(params.lat))
  url.searchParams.set('location.longitude', String(params.lng))
  url.searchParams.set('location.within', `${params.radius}mi`)
  url.searchParams.set('expand', 'venue,ticket_availability,logo')
  url.searchParams.set('page_size', String(Math.min(params.size, 50)))  // EB max is 50
  url.searchParams.set('page', String(params.page + 1))                  // 1-indexed
  url.searchParams.set('sort_by', 'date')

  if (params.keyword) {
    url.searchParams.set('q', params.keyword)
  }
  if (params.startDateTime) {
    url.searchParams.set('start_date.range_start', params.startDateTime)
  }
  if (params.endDateTime) {
    url.searchParams.set('start_date.range_end', params.endDateTime)
  }
  if (params.eventType) {
    const categories = EVENT_TYPE_TO_EB_CATEGORIES[params.eventType]
    if (categories) {
      url.searchParams.set('categories', categories.join(','))
    }
  }

  logger.info({ url: url.toString() }, 'Calling Eventbrite API')

  const response = await fetch(url.toString(), { headers: getHeaders() })

  if (!response.ok) {
    if (response.status === 404) {
      ebDiscoveryUnavailable = true
      logger.warn(
        'Eventbrite Discovery API returned 404 — public event search requires an approved ' +
        'Distribution Partner account. Disabling EB search for this session. ' +
        'Web search fallback will cover Eventbrite-listed events instead.'
      )
    } else {
      const body = await response.text()
      logger.error({ status: response.status, body }, 'Eventbrite API error')
    }
    return { events: [], total: 0 }
  }

  const data: EbSearchResponse = await response.json()
  const rawEvents: EbEvent[] = data.events ?? []

  const events = rawEvents
    .map(mapEventbriteEvent)
    .filter((e): e is UnifiedEvent => e !== null)

  return {
    events,
    total: data.pagination.object_count,
  }
}

export async function getEventbriteEventById(sourceId: string): Promise<UnifiedEvent | null> {
  if (!env.EVENTBRITE_API_KEY) return null

  const url = new URL(`${BASE_URL}/events/${sourceId}/`)
  url.searchParams.set('expand', 'venue,ticket_availability,logo')

  logger.info({ sourceId }, 'Fetching single Eventbrite event')
  const response = await fetch(url.toString(), { headers: getHeaders() })

  if (!response.ok) {
    logger.warn({ status: response.status, sourceId }, 'Eventbrite single-event fetch failed')
    return null
  }

  const data: EbEvent = await response.json()
  return mapEventbriteEvent(data)
}
