import { apiClient } from './client'
import type { UnifiedEvent } from 'shared'

export interface AiSearchParams {
  query: string
  lat: number
  lng: number
  radius: number
}

export interface AiSearchResponse {
  events: UnifiedEvent[]
  aiSummary: string
  extractedParams: Record<string, unknown>
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

export async function aiSearchEvents(params: AiSearchParams): Promise<AiSearchResponse> {
  const { data } = await apiClient.post<AiSearchResponse>('/ai/search', params)
  return data
}
