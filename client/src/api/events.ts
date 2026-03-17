import { apiClient } from './client'
import type { UnifiedEvent, EventsSearchResponse } from 'shared'

export interface EventSearchParams {
  lat: number
  lng: number
  radius?: number
  keyword?: string
  eventType?: string
  startDate?: string
  endDate?: string
  page?: number
  size?: number
  sort?: 'date' | 'relevance' | 'name'
}

export async function fetchEvents(params: EventSearchParams): Promise<EventsSearchResponse<UnifiedEvent>> {
  const { data } = await apiClient.get<EventsSearchResponse<UnifiedEvent>>('/events', { params })
  return data
}

/** Fire-and-forget affiliate click tracking. Errors are silently swallowed. */
export function trackEventClick(id: string, source: string): void {
  apiClient.post(`/events/${id}/click`, { source }).catch(() => {})
}
