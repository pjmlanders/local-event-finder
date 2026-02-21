export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export interface SourceBreakdown {
  ticketmaster: number
  seatgeek: number
  duplicatesRemoved: number
}

export interface EventsSearchResponse<T> extends PaginatedResponse<T> {
  sources: SourceBreakdown
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
