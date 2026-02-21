import type { UnifiedEvent, EventType } from 'shared'
import type { SgEvent } from '../types/seatgeek.types.js'

const TYPE_MAP: Record<string, EventType> = {
  concert: 'music',
  music_festival: 'music',
  sports: 'sports',
  baseball: 'sports',
  basketball: 'sports',
  football: 'sports',
  hockey: 'sports',
  soccer: 'sports',
  mma: 'sports',
  wrestling: 'sports',
  golf: 'sports',
  tennis: 'sports',
  auto_racing: 'sports',
  horse_racing: 'sports',
  theater: 'theatre',
  broadway_tickets_national: 'musical',
  musical: 'musical',
  comedy: 'comedy',
  family: 'family',
  circus: 'family',
  film: 'film',
  dance_performance_tour: 'theatre',
  classical: 'music',
  literary: 'other',
}

function mapEventType(event: SgEvent): EventType {
  // Check taxonomy names first
  for (const tax of event.taxonomies) {
    const mapped = TYPE_MAP[tax.name]
    if (mapped) return mapped
  }
  // Fallback to event type field
  const mapped = TYPE_MAP[event.type]
  if (mapped) return mapped
  return 'other'
}

function getBestImage(performers: SgEvent['performers']): string | null {
  if (!performers || performers.length === 0) return null
  // Prefer the first performer with an image
  for (const p of performers) {
    if (p.images?.huge) return p.images.huge
    if (p.image) return p.image
  }
  return null
}

export function mapSeatgeekEvent(sg: SgEvent): UnifiedEvent | null {
  const venue = sg.venue
  if (!venue?.location?.lat || !venue?.location?.lon) return null

  // Parse datetime_local for date and time
  const dtLocal = sg.datetime_local || sg.datetime_utc
  const localDate = dtLocal.split('T')[0]
  const localTime = dtLocal.includes('T') ? dtLocal.split('T')[1].substring(0, 5) + ':00' : null

  const primaryPerformer = sg.performers?.[0]

  return {
    id: `sg_${sg.id}`,
    source: 'seatgeek',
    sourceId: String(sg.id),
    name: sg.title,
    description: sg.description ?? null,
    eventType: mapEventType(sg),
    genre: primaryPerformer?.type ?? null,
    subGenre: null,

    startDate: localDate,
    startTime: sg.datetime_tbd ? null : localTime,
    endDate: null,
    timezone: null,
    dateStatus: sg.datetime_tbd ? 'tbd' : 'confirmed',

    venue: {
      name: venue.name_v2 || venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      postalCode: venue.postal_code,
      latitude: venue.location.lat,
      longitude: venue.location.lon,
    },

    imageUrl: getBestImage(sg.performers),
    images: [],

    priceRange: sg.stats.lowest_price != null
      ? {
          min: sg.stats.lowest_price,
          max: sg.stats.highest_price,
          currency: 'USD',
        }
      : null,

    url: sg.url,
    popularity: sg.score > 0 ? Math.round(sg.score * 100) : null,
  }
}
