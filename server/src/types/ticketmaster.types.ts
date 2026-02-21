export interface TmSearchResponse {
  _embedded?: {
    events: TmEvent[]
  }
  page: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

export interface TmEvent {
  id: string
  name: string
  type: string
  url: string
  info?: string
  pleaseNote?: string
  dates: {
    start: {
      localDate: string
      localTime?: string
      dateTime?: string
      dateTBD: boolean
      dateTBA: boolean
      timeTBA: boolean
    }
    end?: {
      localDate?: string
    }
    timezone?: string
    status: {
      code: string
    }
  }
  classifications?: TmClassification[]
  priceRanges?: TmPriceRange[]
  images?: TmImage[]
  _embedded?: {
    venues?: TmVenue[]
    attractions?: TmAttraction[]
  }
}

export interface TmClassification {
  primary: boolean
  segment: { id: string; name: string }
  genre?: { id: string; name: string }
  subGenre?: { id: string; name: string }
}

export interface TmPriceRange {
  type: string
  currency: string
  min: number
  max: number
}

export interface TmImage {
  ratio?: string
  url: string
  width: number
  height: number
}

export interface TmVenue {
  id: string
  name: string
  address?: { line1?: string }
  city?: { name: string }
  state?: { stateCode: string; name: string }
  postalCode?: string
  location?: {
    longitude: string
    latitude: string
  }
}

export interface TmAttraction {
  id: string
  name: string
}
