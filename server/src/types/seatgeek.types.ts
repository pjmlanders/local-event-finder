export interface SgSearchResponse {
  events: SgEvent[]
  meta: {
    total: number
    took: number
    page: number
    per_page: number
  }
}

export interface SgEvent {
  id: number
  title: string
  short_title: string
  type: string
  datetime_utc: string
  datetime_local: string
  datetime_tbd: boolean
  venue: SgVenue
  performers: SgPerformer[]
  stats: {
    lowest_price: number | null
    highest_price: number | null
    average_price: number | null
    listing_count: number | null
  }
  url: string
  score: number
  announce_date: string | null
  taxonomies: SgTaxonomy[]
  description?: string
}

export interface SgVenue {
  id: number
  name: string
  address: string | null
  city: string
  state: string
  postal_code: string | null
  country: string
  location: {
    lat: number
    lon: number
  }
  url: string
  score: number
  name_v2: string
}

export interface SgPerformer {
  id: number
  name: string
  short_name: string
  image: string | null
  images: Record<string, string>
  type: string
  score: number
  url: string
}

export interface SgTaxonomy {
  id: number
  name: string
  parent_id: number | null
}
