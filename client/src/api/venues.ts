import { apiClient } from './client'
import type { UnifiedEvent } from 'shared'

export interface VenueResult {
  key: string          // "name|city|state"
  name: string
  city: string
  state: string
  address: string | null
  postalCode: string | null
  latitude: number
  longitude: number
  distanceMiles: number
  eventCount: number
  eventTypes: string[]
  sampleEvents: Array<{ id: string; name: string; startDate: string }>
}

export interface VenueEventsResponse {
  data: UnifiedEvent[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export async function fetchVenues(params: {
  lat: number
  lng: number
  radius: number
  keyword?: string
}): Promise<{ data: VenueResult[]; total: number }> {
  const { data } = await apiClient.get('/venues', { params })
  return data
}

export async function fetchVenueEvents(
  venueKey: string,
  params: { lat: number; lng: number; radius?: number; page?: number; size?: number }
): Promise<VenueEventsResponse> {
  const { data } = await apiClient.get(`/venues/${encodeURIComponent(venueKey)}/events`, { params })
  return data
}
