import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { apiClient } from '../api/client'
import type { UnifiedEvent } from 'shared'
import { formatEventDate, formatEventTime, formatPrice } from '../utils/formatDate'
import FavoriteButton from '../components/ui/FavoriteButton'

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

const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: 'Ticketmaster', seatgeek: 'SeatGeek', web: 'Web',
}

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: 'bg-blue-50 text-blue-600',
  seatgeek: 'bg-emerald-50 text-emerald-600',
  web: 'bg-orange-50 text-orange-600',
}

const BUY_BUTTON_LABELS: Record<string, string> = {
  ticketmaster: 'Buy on Ticketmaster',
  seatgeek: 'Buy on SeatGeek',
  web: 'View Event',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addUtm(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', 'localevents')
    u.searchParams.set('utm_medium', 'referral')
    u.searchParams.set('utm_campaign', 'detail')
    return u.toString()
  } catch {
    return url
  }
}

function getBestImage(event: UnifiedEvent): string | null {
  // Prefer the highest-resolution image from the images array
  if (event.images && event.images.length > 0) {
    const sorted = [...event.images].sort((a, b) => (b.width * b.height) - (a.width * a.height))
    return sorted[0].url
  }
  return event.imageUrl
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-9 w-20 rounded-lg bg-gray-200" />
        <div className="h-9 w-20 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-60 rounded-xl bg-gray-200" />
        <div className="h-60 rounded-xl bg-gray-200" />
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gray-200" />
          <div className="h-6 w-24 rounded-full bg-gray-200" />
        </div>
        <div className="h-9 w-3/4 rounded-lg bg-gray-200" />
        <div className="h-5 w-1/3 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />
        <div className="h-5 w-1/2 rounded bg-gray-200" />
        <div className="h-32 rounded-xl bg-gray-200" />
      </div>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">Event not found</h2>
      <p className="mb-6 text-gray-500">This event may have been removed or the link is invalid.</p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go back
        </button>
        <Link
          to="/search"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Browse events
        </Link>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data } = await apiClient.get<UnifiedEvent>(`/events/${id}`)
      return data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  async function handleShare() {
    const url = window.location.href
    if (navigator.share && event) {
      try {
        await navigator.share({ title: event.name, url })
      } catch {
        // User cancelled share sheet — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 2000)
      } catch {
        // Clipboard not available
      }
    }
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError || !event) return <NotFound />

  const heroImage = getBestImage(event)
  const typeColor = TYPE_COLORS[event.eventType] ?? TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[event.eventType] ?? 'Event'
  const sourceColor = SOURCE_COLORS[event.source] ?? 'bg-gray-50 text-gray-600'
  const sourceLabel = SOURCE_LABELS[event.source] ?? event.source
  const buyLabel = BUY_BUTTON_LABELS[event.source] ?? 'Get Tickets'
  const { latitude: lat, longitude: lng } = event.venue

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back + Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {shareState === 'copied' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>

      {/* Hero image + map side-by-side on desktop, stacked on mobile */}
      <div className={`grid gap-4 ${heroImage ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Venue map */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <MapContainer
            center={[lat, lng]}
            zoom={14}
            style={{ height: 240, width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[lat, lng]}>
              <Popup>
                <strong>{event.venue.name}</strong>
                {event.venue.address && <><br />{event.venue.address}</>}
                <br />{event.venue.city}, {event.venue.state}
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Hero image */}
        {heroImage && (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <img
              src={heroImage}
              alt={event.name}
              className="h-60 w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Event details card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
              {typeLabel}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceColor}`}>
              {sourceLabel}
            </span>
            {event.dateStatus === 'tbd' && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Date TBD
              </span>
            )}
            {event.dateStatus === 'tba' && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Date TBA
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{event.name}</h1>

          {/* Genre */}
          {event.genre && (
            <p className="text-sm text-gray-500">
              {event.genre}{event.subGenre ? ` · ${event.subGenre}` : ''}
            </p>
          )}

          {/* Date + time */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{formatEventDate(event.startDate)}</span>
              {event.endDate && event.endDate !== event.startDate && (
                <span className="text-gray-500">– {formatEventDate(event.endDate)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{formatEventTime(event.startTime)}</span>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">{event.venue.name}</p>
              <p className="text-sm text-gray-500">
                {event.venue.city}, {event.venue.state}
                {event.venue.postalCode ? ` ${event.venue.postalCode}` : ''}
              </p>
              {event.venue.address && (
                <p className="text-sm text-gray-400">{event.venue.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 space-y-4">
          {/* Price */}
          {event.priceRange && (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.028 2.353 1.118V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.028-2.354-1.118V5z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-semibold text-gray-900">
                {formatPrice(event.priceRange.min, event.priceRange.max, event.priceRange.currency)}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <FavoriteButton event={event} size="md" />

            {/* Buy Tickets */}
            <a
              href={addUtm(event.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
              </svg>
              {buyLabel}
            </a>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">About this Event</h2>
          <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{event.description}</p>
        </div>
      )}
    </div>
  )
}
