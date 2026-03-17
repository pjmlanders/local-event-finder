import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useLocation } from '../context/LocationContext'
import { fetchVenueEvents } from '../api/venues'
import EventDrawer from '../components/ui/EventDrawer'
import { formatEventDate, formatEventTime, formatPrice } from '../utils/formatDate'
import type { UnifiedEvent } from 'shared'

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  music: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  theatre: 'bg-amber-100 text-amber-700',
  musical: 'bg-pink-100 text-pink-700',
  comedy: 'bg-yellow-100 text-yellow-700',
  family: 'bg-blue-100 text-blue-700',
  film: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  music: 'Music', sports: 'Sports', theatre: 'Theatre', musical: 'Musical',
  comedy: 'Comedy', family: 'Family', film: 'Film', other: 'Event',
}

// ─── EventRow ────────────────────────────────────────────────────────────────

function EventRow({
  event,
  onClick,
}: {
  event: UnifiedEvent
  onClick: () => void
}) {
  const image =
    event.images && event.images.length > 0
      ? [...event.images].sort((a, b) => b.width * b.height - a.width * a.height)[0].url
      : event.imageUrl

  const typeColor = TYPE_COLORS[event.eventType] ?? TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[event.eventType] ?? 'Event'

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      {/* Thumbnail */}
      {image ? (
        <img
          src={image}
          alt=""
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-2xl">
          {event.eventType === 'music' ? '🎵' :
           event.eventType === 'sports' ? '🏟' :
           event.eventType === 'theatre' ? '🎭' : '🎪'}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-semibold text-slate-900 transition-colors group-hover:text-indigo-700">
          {event.name}
        </p>
        <p className="text-sm text-slate-500">
          {formatEventDate(event.startDate)}
          {event.startTime ? ` · ${formatEventTime(event.startTime)}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
            {typeLabel}
          </span>
          {event.priceRange && (
            <span className="text-xs font-medium text-green-600">
              {formatPrice(event.priceRange.min, event.priceRange.max, event.priceRange.currency)}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenueDetailPage() {
  const { venueKey: rawKey } = useParams<{ venueKey: string }>()
  const navigate = useNavigate()
  const { lat, lng, radius } = useLocation()

  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null)

  // React Router v6 decodes params, but be safe
  const venueKey = decodeURIComponent(rawKey ?? '')
  const parts = venueKey.split('|')
  const venueName = parts[0] ?? ''
  const venueCity = parts[1] ?? ''
  const venueState = parts[2] ?? ''

  // Use a wider search radius for venue events so we don't miss shows
  const searchRadius = Math.max(radius, 50)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['venue-events', venueKey, lat, lng, searchRadius],
    queryFn: () => fetchVenueEvents(venueKey, { lat, lng, radius: searchRadius, size: 50 }),
    enabled: !!venueKey && lat !== 0,
    staleTime: 5 * 60 * 1000,
  })

  const events = data?.data ?? []

  // Derive map coords from the first event's venue
  const firstVenue = events[0]?.venue
  const mapCenter = firstVenue
    ? ([firstVenue.latitude, firstVenue.longitude] as [number, number])
    : null
  const displayAddress = firstVenue?.address ?? null
  const displayPostal = firstVenue?.postalCode ?? null

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to venues
      </button>

      {/* Venue header: info + map */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Info */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{venueName}</h1>
          <p className="text-slate-500">
            {venueCity}, {venueState}
            {displayAddress ? ` · ${displayAddress}` : ''}
            {displayPostal ? ` ${displayPostal}` : ''}
          </p>
          {!isLoading && (
            <p className="text-sm font-medium text-indigo-600">
              {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
            </p>
          )}
          {isLoading && (
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          )}
        </div>

        {/* Map (shown once we have coords) */}
        {mapCenter ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: 200, width: '100%' }}
              scrollWheelZoom={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={mapCenter}>
                <Popup>
                  <strong>{venueName}</strong>
                  {displayAddress && <><br />{displayAddress}</>}
                  <br />{venueCity}, {venueState}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        ) : isLoading ? (
          <div className="h-[200px] animate-pulse rounded-xl bg-slate-100" />
        ) : null}
      </div>

      {/* Events section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming Shows</h2>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load events for this venue.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-slate-500">No upcoming events found at this venue.</p>
            <p className="mt-1 text-xs text-slate-400">
              Check back soon — shows are added regularly.
            </p>
          </div>
        )}

        {/* Event list */}
        {!isLoading && !isError && events.length > 0 && (
          <div className="space-y-2.5">
            {events.map(event => (
              <EventRow
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event detail drawer — slides in when a show is selected */}
      <EventDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
