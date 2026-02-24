import type { UnifiedEvent, EventType } from 'shared'
import type { EbEvent } from '../types/eventbrite.types.js'

// Eventbrite top-level category IDs
const EB_CATEGORY_MAP: Record<string, EventType> = {
  '103': 'music',
  '105': 'theatre',      // Performing & Visual Arts
  '104': 'film',         // Film, Media & Entertainment
  '115': 'family',       // Family & Education
  '108': 'sports',       // Sports & Fitness
}

// Eventbrite subcategory IDs that indicate comedy (under category 105)
const COMEDY_SUBCATEGORY_IDS = new Set(['5003'])

function mapEventType(event: EbEvent): EventType {
  if (event.subcategory_id && COMEDY_SUBCATEGORY_IDS.has(event.subcategory_id)) {
    return 'comedy'
  }
  const mapped = event.category_id ? EB_CATEGORY_MAP[event.category_id] : undefined
  return mapped ?? 'other'
}

function parseDate(localDateTime: string): { date: string; time: string | null } {
  const idx = localDateTime.indexOf('T')
  if (idx === -1) return { date: localDateTime, time: null }
  return {
    date: localDateTime.slice(0, idx),
    time: localDateTime.slice(idx + 1) || null,
  }
}

export function mapEventbriteEvent(eb: EbEvent): UnifiedEvent | null {
  // Skip cancelled events
  if (eb.is_cancelled || eb.status === 'cancelled') return null

  const venue = eb.venue
  const lat = venue?.address?.latitude ? parseFloat(venue.address.latitude) : null
  const lng = venue?.address?.longitude ? parseFloat(venue.address.longitude) : null

  // Require venue coordinates to show on map
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null

  const { date: startDate, time: startTime } = parseDate(eb.start.local)
  const endParsed = eb.end ? parseDate(eb.end.local) : null

  const venueName = venue?.name ?? 'Unknown Venue'
  const city = venue?.address?.city ?? 'Unknown'
  const state = venue?.address?.region ?? 'Unknown'

  // Price
  const minPrice = eb.ticket_availability?.minimum_ticket_price?.major_value
  const maxPrice = eb.ticket_availability?.maximum_ticket_price?.major_value
  const currency = eb.ticket_availability?.minimum_ticket_price?.currency ?? 'USD'
  const priceRange = eb.is_free
    ? { min: 0, max: 0, currency }
    : minPrice != null
      ? { min: parseFloat(minPrice), max: maxPrice != null ? parseFloat(maxPrice) : null, currency }
      : null

  return {
    id: `eb_${eb.id}`,
    source: 'eventbrite',
    sourceId: eb.id,
    name: eb.name.text,
    description: eb.description?.text ?? null,
    eventType: mapEventType(eb),
    genre: null,
    subGenre: null,

    startDate,
    startTime,
    endDate: endParsed?.date ?? null,
    timezone: eb.start.timezone ?? null,
    dateStatus: 'confirmed',

    venue: {
      name: venueName,
      address: venue?.address?.address_1 ?? null,
      city,
      state,
      postalCode: venue?.address?.postal_code ?? null,
      latitude: lat,
      longitude: lng,
    },

    imageUrl: eb.logo?.original?.url ?? eb.logo?.url ?? null,
    images: eb.logo?.original
      ? [{ url: eb.logo.original.url, width: eb.logo.original.width, height: eb.logo.original.height }]
      : eb.logo?.url
        ? [{ url: eb.logo.url, width: 0, height: 0 }]
        : [],

    priceRange,
    url: eb.url,
    popularity: null,
  }
}
