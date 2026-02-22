import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getFavorites } from '../api/users'
import EventCard from '../components/events/EventCard'
import FavoriteButton from '../components/ui/FavoriteButton'

export default function FavoritesPage() {
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saved Events</h1>
        {favorites.length > 0 && (
          <span className="text-sm text-gray-500">{favorites.length} saved</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-gray-700">No saved events yet</h2>
          <p className="mb-6 text-sm text-gray-500">Browse events and tap the heart icon to save them here.</p>
          <Link to="/search" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Browse events
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(event => (
            <div key={event.id} className="relative">
              <EventCard event={event} />
              <div className="absolute right-2 top-2 z-10">
                <FavoriteButton event={event} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
