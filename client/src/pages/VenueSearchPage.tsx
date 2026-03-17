import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from '../context/LocationContext'
import { fetchVenues, type VenueResult } from '../api/venues'
import LocationPicker from '../components/search/LocationPicker'
import { formatShortDate } from '../utils/formatDate'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  music: '🎵',
  sports: '🏟',
  theatre: '🎭',
  musical: '🎭',
  comedy: '🎤',
  family: '👨‍👩‍👧',
  film: '🎬',
  other: '🎪',
}

// ─── VenueCard ───────────────────────────────────────────────────────────────

function VenueCard({ venue }: { venue: VenueResult }) {
  return (
    <Link
      to={`/venues/${encodeURIComponent(venue.key)}`}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      {/* Name + event count */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
            {venue.name}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {venue.city}, {venue.state}
            {venue.address ? ` · ${venue.address}` : ''}
          </p>
        </div>
        <div className="flex-shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 text-center">
          <p className="text-lg font-bold leading-none text-indigo-700">{venue.eventCount}</p>
          <p className="mt-0.5 text-xs text-indigo-500">
            {venue.eventCount === 1 ? 'event' : 'events'}
          </p>
        </div>
      </div>

      {/* Event type icons + distance */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[...new Set(venue.eventTypes)].slice(0, 5).map(type => (
            <span key={type} title={type} className="text-base">
              {TYPE_ICONS[type] ?? '🎪'}
            </span>
          ))}
        </div>
        <span className="text-xs text-slate-400">{venue.distanceMiles} mi away</span>
      </div>

      {/* Sample upcoming events */}
      {venue.sampleEvents.length > 0 && (
        <ul className="space-y-1 border-t border-slate-100 pt-2.5">
          {venue.sampleEvents.slice(0, 2).map(e => (
            <li key={e.id} className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="truncate">{e.name}</span>
              <span className="flex-shrink-0 text-slate-400">{formatShortDate(e.startDate)}</span>
            </li>
          ))}
          {venue.eventCount > 2 && (
            <li className="text-xs text-indigo-500">
              +{venue.eventCount - 2} more
            </li>
          )}
        </ul>
      )}

      {/* CTA */}
      <div className="flex items-center justify-end gap-1 text-xs font-medium text-indigo-600">
        View all shows
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenueSearchPage() {
  const { lat, lng, radius, status } = useLocation()
  const [venueSearch, setVenueSearch] = useState('')

  const hasLocation = status === 'success' && (lat !== 0 || lng !== 0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['venues', lat, lng, radius],
    queryFn: () => fetchVenues({ lat, lng, radius }),
    enabled: hasLocation,
    staleTime: 5 * 60 * 1000,
  })

  const venues = data?.data ?? []

  const filtered = venueSearch.trim()
    ? venues.filter(
        v =>
          v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
          v.city.toLowerCase().includes(venueSearch.toLowerCase())
      )
    : venues

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Venues Near You</h1>
        <p className="mt-1 text-sm text-slate-500">
          Browse local venues and tap any one to see upcoming shows
        </p>
      </div>

      {/* Location prompt */}
      {!hasLocation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="mb-3 text-sm font-medium text-amber-800">
            Set your location to discover venues
          </p>
          <LocationPicker />
        </div>
      )}

      {hasLocation && (
        <>
          {/* Venue name search */}
          <div className="relative max-w-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Filter by venue name or city…"
              value={venueSearch}
              onChange={e => setVenueSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {venueSearch && (
              <button
                onClick={() => setVenueSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load venues. Make sure the server is running.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="font-medium text-slate-600">
                {venueSearch ? `No venues match "${venueSearch}"` : 'No venues found in this area'}
              </p>
              {venueSearch && (
                <button
                  onClick={() => setVenueSearch('')}
                  className="mt-2 text-sm text-indigo-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <p className="text-sm text-slate-500">
                {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'} within {radius} miles
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(venue => (
                  <VenueCard key={venue.key} venue={venue} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
