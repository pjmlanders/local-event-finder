import { useNavigate } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import { useEvents } from '../hooks/useEvents'
import LocationPicker from '../components/search/LocationPicker'
import EventCard from '../components/events/EventCard'

const CATEGORIES = [
  { value: 'music', label: 'Music', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { value: 'sports', label: 'Sports', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { value: 'theatre', label: 'Theatre', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { value: 'comedy', label: 'Comedy', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'family', label: 'Family', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { value: 'film', label: 'Film', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
] as const

export default function HomePage() {
  const navigate = useNavigate()
  const { lat, lng, radius, status } = useLocation()
  const hasLocation = lat !== 0 || lng !== 0

  const { data, isLoading } = useEvents(
    hasLocation ? { lat, lng, radius, size: 7 } : null,
  )

  const featuredEvent = data?.data[0]
  const gridEvents = data?.data.slice(1) ?? []

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Discover Events Near You</h2>
          <p className="mb-6 text-indigo-200">
            Concerts, sports, theatre, comedy and more — all in one place
          </p>
        </div>
        <div className="mx-auto max-w-lg rounded-xl bg-white/10 p-4 backdrop-blur-sm">
          <LocationPicker />
        </div>
      </section>

      {/* Category Grid */}
      {hasLocation && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Browse Categories</h3>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all &rarr;
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => navigate(`/search?type=${cat.value}`)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 transition-colors group-hover:bg-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-gray-400">Finding events near you...</p>
        </div>
      )}

      {/* Featured Event */}
      {featuredEvent && (
        <section>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Featured</h3>
          <EventCard event={featuredEvent} featured />
        </section>
      )}

      {/* Upcoming Events Grid */}
      {gridEvents.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              See all &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gridEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasLocation && status === 'idle' && (
        <div className="py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-4 text-lg text-gray-500">Set your location to start discovering events</p>
        </div>
      )}
    </div>
  )
}
