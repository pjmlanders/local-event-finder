import type { EventType, UnifiedEvent } from './event.js'

export interface SearchParams {
  lat: number
  lng: number
  radius?: number
  keyword?: string
  eventType?: EventType
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sort?: 'date' | 'relevance' | 'name'
  sources?: string
}

export interface AiSearchRequest {
  query: string
  lat?: number
  lng?: number
  radius?: number
}

export interface AiSearchResponse {
  events: UnifiedEvent[]
  aiSummary: string
  extractedParams: Partial<SearchParams>
  totalResults: number
}

export interface Recommendation {
  event: UnifiedEvent
  reason: string
  score: number
}

export interface AiRecommendRequest {
  lat: number
  lng: number
  radius?: number
  count?: number
}

export interface AiRecommendResponse {
  recommendations: Recommendation[]
}
