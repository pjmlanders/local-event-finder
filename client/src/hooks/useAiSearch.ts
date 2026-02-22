import { useMutation } from '@tanstack/react-query'
import { aiSearchEvents, type AiSearchParams, type AiSearchResponse } from '../api/ai'

export function useAiSearch() {
  return useMutation<AiSearchResponse, Error, AiSearchParams>({
    mutationFn: aiSearchEvents,
  })
}
