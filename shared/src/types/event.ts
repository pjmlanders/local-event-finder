export type EventType =
  | 'music'
  | 'sports'
  | 'theatre'
  | 'musical'
  | 'comedy'
  | 'family'
  | 'film'
  | 'other'

export interface EventImage {
  url: string
  width: number
  height: number
}

export interface Venue {
  name: string
  address: string | null
  city: string
  state: string
  postalCode: string | null
  latitude: number
  longitude: number
}

export interface PriceRange {
  min: number | null
  max: number | null
  currency: string
}

export interface UnifiedEvent {
  id: string
  source: 'ticketmaster' | 'seatgeek' | 'web'
  sourceId: string
  name: string
  description: string | null
  eventType: EventType
  genre: string | null
  subGenre: string | null

  startDate: string
  startTime: string | null
  endDate: string | null
  timezone: string | null
  dateStatus: 'confirmed' | 'tbd' | 'tba'

  venue: Venue

  imageUrl: string | null
  images: EventImage[]

  priceRange: PriceRange | null

  url: string

  popularity: number | null
  isFavorited?: boolean
}
