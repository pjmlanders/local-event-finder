import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { addFavorite, removeFavorite, getFavorites } from '../../api/users'
import type { UnifiedEvent } from 'shared'

interface FavoriteButtonProps {
  event: UnifiedEvent
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ event, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const isFavorited = favorites.some(f => f.id === event.id)

  const { mutate, isPending } = useMutation({
    mutationFn: () => isFavorited ? removeFavorite(event.id) : addFavorite(event),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] })
      const previous = queryClient.getQueryData<UnifiedEvent[]>(['favorites'])
      queryClient.setQueryData<UnifiedEvent[]>(['favorites'], old => {
        if (isFavorited) return (old ?? []).filter(f => f.id !== event.id)
        return [...(old ?? []), event]
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['favorites'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'

  if (!user) {
    return (
      <button
        disabled
        title="Sign in to save favorites"
        className={`flex items-center gap-2 rounded-lg border border-gray-300 ${padding} font-medium text-gray-400 cursor-not-allowed`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Save
      </button>
    )
  }

  return (
    <button
      onClick={() => mutate()}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-lg border ${
        isFavorited
          ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      } ${padding} font-medium transition-colors disabled:opacity-50`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={iconSize}
        fill={isFavorited ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {isFavorited ? 'Saved' : 'Save'}
    </button>
  )
}
