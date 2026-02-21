import type { UnifiedEvent, EventType } from 'shared'
import type { TmEvent } from '../types/ticketmaster.types.js'

const SEGMENT_MAP: Record<string, EventType> = {
  'Music': 'music',
  'Sports': 'sports',
  'Arts & Theatre': 'theatre',
  'Film': 'film',
  'Comedy': 'comedy',
  'Family': 'family',
  'Miscellaneous': 'other',
  'Undefined': 'other',
}

function mapEventType(classifications?: TmEvent['classifications']): EventType {
  if (!classifications || classifications.length === 0) return 'other'
  const primary = classifications.find(c => c.primary) ?? classifications[0]
  const segmentName = primary.segment?.name ?? 'Undefined'

  if (primary.genre?.name?.toLowerCase().includes('musical')) return 'musical'

  return SEGMENT_MAP[segmentName] ?? 'other'
}

function getDateStatus(dates: TmEvent['dates']): 'confirmed' | 'tbd' | 'tba' {
  if (dates.start.dateTBD) return 'tbd'
  if (dates.start.dateTBA) return 'tba'
  return 'confirmed'
}

function getBestImage(images?: TmEvent['images']): string | null {
  if (!images || images.length === 0) return null
  const sorted = [...images].sort((a, b) => (b.width * b.height) - (a.width * a.height))
  return sorted[0].url
}

export function mapTicketmasterEvent(tm: TmEvent): UnifiedEvent | null {
  const venue = tm._embedded?.venues?.[0]
  if (!venue?.location?.latitude || !venue?.location?.longitude) return null

  const lat = parseFloat(venue.location.latitude)
  const lng = parseFloat(venue.location.longitude)
  if (isNaN(lat) || isNaN(lng)) return null

  const primaryClassification = tm.classifications?.find(c => c.primary) ?? tm.classifications?.[0]

  return {
    id: `tm_${tm.id}`,
    source: 'ticketmaster',
    sourceId: tm.id,
    name: tm.name,
    description: tm.info ?? tm.pleaseNote ?? null,
    eventType: mapEventType(tm.classifications),
    genre: primaryClassification?.genre?.name ?? null,
    subGenre: primaryClassification?.subGenre?.name ?? null,

    startDate: tm.dates.start.localDate,
    startTime: tm.dates.start.localTime ?? null,
    endDate: tm.dates.end?.localDate ?? null,
    timezone: tm.dates.timezone ?? null,
    dateStatus: getDateStatus(tm.dates),

    venue: {
      name: venue.name,
      address: venue.address?.line1 ?? null,
      city: venue.city?.name ?? 'Unknown',
      state: venue.state?.stateCode ?? venue.state?.name ?? 'Unknown',
      postalCode: venue.postalCode ?? null,
      latitude: lat,
      longitude: lng,
    },

    imageUrl: getBestImage(tm.images),
    images: (tm.images ?? []).map(img => ({
      url: img.url,
      width: img.width,
      height: img.height,
    })),

    priceRange: tm.priceRanges?.[0]
      ? {
          min: tm.priceRanges[0].min,
          max: tm.priceRanges[0].max,
          currency: tm.priceRanges[0].currency,
        }
      : null,

    url: tm.url,
    popularity: null,
  }
}
