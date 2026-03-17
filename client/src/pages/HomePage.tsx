import { useNavigate } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import { useEvents } from '../hooks/useEvents'
import LocationPicker from '../components/search/LocationPicker'
import EventCard from '../components/events/EventCard'
import Searchlights from '../components/ui/Searchlights'

const CATEGORIES = [
  {
    value: 'music', label: 'Music',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    value: 'sports', label: 'Sports',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    value: 'theatre', label: 'Theatre',
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    value: 'comedy', label: 'Comedy',
    icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    value: 'family', label: 'Family',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    value: 'film', label: 'Film',
    icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
    gradient: 'from-rose-500 to-red-600',
  },
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
    <div className="space-y-10 sm:space-y-12">
      {/* Hero with searchlights */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0e0a1f] px-6 py-14 text-white sm:px-10 sm:py-20">
        {/* Searchlight beams */}
        <Searchlights />

        {/* Star-field / dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        {/* Subtle ambient glows behind content */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-[400px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 h-40 w-40 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-40 w-40 -translate-y-1/2 rounded-full bg-amber-500/8 blur-3xl" />

        {/* Ground reflection stripe */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-violet-500/5 to-transparent" />

        <div className="relative mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-300" />
            </span>
            Live events near you
          </span>

          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tonight's Spotlight<br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-amber-300 bg-clip-text text-transparent">Is on Your City</span>
          </h2>
          <p className="mb-8 text-base text-slate-300/90 sm:text-lg">
            Concerts, sports, theatre, comedy and more — discover what's happening near you
          </p>
        </div>

        <div className="relative mx-auto max-w-lg rounded-xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
          <LocationPicker variant="hero" />
        </div>
      </section>

      {/* Category Grid */}
      {hasLocation && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title-lg">Browse by Category</h3>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => navigate(`/search?type=${cat.value}`)}
                className="group flex flex-col items-center gap-2.5 overflow-hidden rounded-xl p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} shadow-sm transition-transform duration-200 group-hover:scale-110`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-slate-900">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Finding events near you...</p>
        </div>
      )}

      {/* Featured Event */}
      {featuredEvent && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-violet-500 ring-2 ring-violet-200" />
            <h3 className="section-title-lg">Featured Event</h3>
          </div>
          <EventCard event={featuredEvent} featured />
        </section>
      )}

      {/* Upcoming Events Grid */}
      {gridEvents.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="section-title-lg">Upcoming Events</h3>
            <button
              onClick={() => navigate('/search')}
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              See all →
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
        <div className="surface-card flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="mt-6 text-lg font-medium text-slate-800">Set your location to get started</p>
          <p className="mt-2 text-sm text-slate-500">Use GPS or enter a ZIP code above to discover events near you</p>
        </div>
      )}
    </div>
  )
}
