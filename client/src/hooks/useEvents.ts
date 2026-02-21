import { useQuery } from '@tanstack/react-query'
import { fetchEvents, type EventSearchParams } from '../api/events'

export function useEvents(params: EventSearchParams | null) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => fetchEvents(params!),
    enabled: params !== null && params.lat !== 0 && params.lng !== 0,
  })
}
