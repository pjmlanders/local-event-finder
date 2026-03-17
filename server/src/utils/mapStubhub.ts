import type { UnifiedEvent, EventType } from 'shared'
import type { ShEvent } from '../types/stubhub.types.js'
import { withAffiliateParams } from './affiliateUrls.js'
import { env } from '../config/env.js'

const CATEGORY_MAP: Record<string, EventType> = {
  'concert': 'music',
  'music': 'music',
  'sports': 'sports',
  'theater': 'theatre',
  'theatre': 'theatre',
  'comedy': 'comedy',
  'family': 'family',
  'film': 'film',
  'movie': 'film',
}

function mapEventType(event: ShEvent): EventType {
  const cats = [
    ...(event.categories ?? []),
    ...(event.ancestors?.categories ?? []),
  ]
  for (const cat of cats) {
    const name = cat.name?.toLowerCase() ?? ''
    for (const [key, type] of Object.entries(CATEGORY_MAP)) {
      if (name.includes(key)) return type
    }
  }
  return 'other'
}

function parseLocalDate(datetime: string): { date: string; time: string | null } {
  // "2026-04-15T20:00:00" → date: "2026-04-15", time: "20:00:00"
  const [date, time] = datetime.split('T')
  return { date, time: time ?? null }
}

export function mapStubhubEvent(sh: ShEvent): UnifiedEvent | null {
  const venue = sh.venue
  if (!venue?.latitude || !venue?.longitude) return null
  if (!sh.eventDateLocal && !sh.eventDateUTC) return null

  const datetime = sh.eventDateLocal ?? sh.eventDateUTC!
  const { date, time } = parseLocalDate(datetime)

  const performer = sh.ancestors?.performers?.[0]
  const imageUrl = performer?.imageUrl ?? null

  const eventUrl = sh._links?.self?.href ?? ''
  if (!eventUrl) return null

  return {
    id: `sh_${sh.id}`,
    source: 'stubhub',
    sourceId: sh.id,
    name: sh.name,
    description: sh.description ?? null,
    eventType: mapEventType(sh),
    genre: sh.ancestors?.categories?.[0]?.name ?? null,
    subGenre: sh.ancestors?.groupings?.[0]?.name ?? null,

    startDate: date,
    startTime: time,
    endDate: null,
    timezone: null,
    dateStatus: sh.status?.toLowerCase() === 'active' ? 'confirmed' : 'confirmed',

    venue: {
      name: venue.name ?? 'Unknown Venue',
      address: venue.address1 ?? null,
      city: venue.city ?? 'Unknown',
      state: venue.state ?? 'Unknown',
      postalCode: venue.postalCode ?? null,
      latitude: venue.latitude,
      longitude: venue.longitude,
    },

    imageUrl,
    images: imageUrl ? [{ url: imageUrl, width: 0, height: 0 }] : [],

    // StubHub doesn't return price in catalog search (only in inventory endpoint)
    priceRange: null,

    url: withAffiliateParams(eventUrl, 'stubhub', {
      stubhub: env.STUBHUB_AFFILIATE_ID,
    }),
    popularity: null,
  }
}
