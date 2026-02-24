export interface EbText {
  text: string
  html: string
}

export interface EbDateTime {
  timezone: string
  local: string  // "2026-03-15T19:00:00"
  utc: string
}

export interface EbAddress {
  address_1?: string
  address_2?: string
  city?: string
  region?: string       // state abbreviation (e.g. "VA")
  postal_code?: string
  country?: string
  latitude?: string
  longitude?: string
  localized_address_display?: string
}

export interface EbVenue {
  id: string
  name?: string
  address?: EbAddress
}

export interface EbLogo {
  url: string
  original?: {
    url: string
    width: number
    height: number
  }
}

export interface EbTicketAvailability {
  is_sold_out?: boolean
  minimum_ticket_price?: {
    display: string
    currency: string
    value: number
    major_value: string
  }
  maximum_ticket_price?: {
    display: string
    currency: string
    value: number
    major_value: string
  }
}

export interface EbEvent {
  id: string
  name: EbText
  description?: EbText
  url: string
  start: EbDateTime
  end?: EbDateTime
  logo?: EbLogo
  category_id?: string
  subcategory_id?: string
  format_id?: string
  venue?: EbVenue
  ticket_availability?: EbTicketAvailability
  is_free?: boolean
  is_cancelled?: boolean
  status?: string
}

export interface EbSearchResponse {
  events?: EbEvent[]
  pagination: {
    object_count: number
    page_number: number
    page_size: number
    page_count: number
    has_more_items: boolean
  }
}
