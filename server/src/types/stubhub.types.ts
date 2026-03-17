// StubHub Catalog API — HAL+JSON response types
// Base URL: https://api.stubhub.net

export interface ShTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface ShSearchResponse {
  total_items: number
  page: number
  page_size: number
  _embedded?: {
    items?: ShEvent[]
  }
  // Some response shapes use a top-level events array
  events?: ShEvent[]
}

export interface ShEvent {
  id: string
  name: string
  eventDateLocal?: string   // ISO datetime in local time: "2026-04-15T20:00:00"
  eventDateUTC?: string     // ISO datetime in UTC
  status?: string           // "Active" | "Cancelled" | "Postponed" | etc.
  currencyCode?: string
  description?: string
  locale?: string
  venue?: ShVenue
  categories?: ShCategory[]
  ancestors?: {
    categories?: ShCategory[]
    groupings?: ShGrouping[]
    performers?: ShPerformer[]
  }
  eventMeta?: {
    primaryAct?: string
    primaryName?: string
    secondaryName?: string
    keywords?: string[]
    locale?: string
  }
  _links?: {
    self?: { href: string }
  }
}

export interface ShVenue {
  id?: string
  name?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  url?: string
}

export interface ShCategory {
  id?: string
  name?: string
}

export interface ShGrouping {
  id?: string
  name?: string
}

export interface ShPerformer {
  id?: string
  name?: string
  url?: string
  imageUrl?: string
}
