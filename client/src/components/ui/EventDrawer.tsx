import { useEffect, useRef } from 'react'
import type { UnifiedEvent } from 'shared'
import { trackEventClick } from '../../api/events'
import { formatEventDate, formatEventTime, formatPrice } from '../../utils/formatDate'
import FavoriteButton from './FavoriteButton'

// ─── Constants ───────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: 'Ticketmaster',
  seatgeek: 'SeatGeek',
  stubhub: 'StubHub',
  eventbrite: 'Eventbrite',
  web: 'Web',
}

const BUY_LABELS: Record<string, string> = {
  ticketmaster: 'Buy on Ticketmaster',
  seatgeek: 'Buy on SeatGeek',
  stubhub: 'Buy on StubHub',
  eventbrite: 'Get Tickets on Eventbrite',
  web: 'View Event',
}

const TYPE_LABELS: Record<string, string> = {
  music: 'Music',
  sports: 'Sports',
  theatre: 'Theatre',
  musical: 'Musical',
  comedy: 'Comedy',
  family: 'Family',
  film: 'Film',
  other: 'Event',
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addUtm(url: string): string {
  try {
    const u = new URL(url)
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'localevents')
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'referral')
    u.searchParams.set('utm_campaign', 'venue')
    return u.toString()
  } catch {
    return url
  }
}

function getBestImage(event: UnifiedEvent): string | null {
  if (event.images && event.images.length > 0) {
    return [...event.images].sort((a, b) => b.width * b.height - a.width * a.height)[0].url
  }
  return event.imageUrl
}

// ─── Component ───────────────────────────────────────────────────────────────

interface EventDrawerProps {
  event: UnifiedEvent | null
  onClose: () => void
}

export default function EventDrawer({ event, onClose }: EventDrawerProps) {
  const isOpen = event !== null
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Move focus to close button for accessibility
      setTimeout(() => closeButtonRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!event) return null

  const heroImage = getBestImage(event)
  const typeColor = TYPE_COLORS[event.eventType] ?? TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[event.eventType] ?? 'Event'
  const buyLabel = BUY_LABELS[event.source] ?? 'Get Tickets'
  const sourceLabel = SOURCE_LABELS[event.source] ?? event.source

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: bottom sheet on mobile, right-side drawer on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.name}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-screen sm:max-h-screen sm:w-[440px] sm:rounded-none sm:rounded-l-2xl"
      >
        {/* Drag handle (mobile only) */}
        <div className="flex-shrink-0 pt-2 pb-0 sm:hidden">
          <div className="mx-auto h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Hero image / gradient header */}
        <div className="relative flex-shrink-0">
          {heroImage ? (
            <img
              src={heroImage}
              alt={event.name}
              className="h-44 w-full object-cover sm:h-52"
            />
          ) : (
            <div className="h-20 bg-gradient-to-br from-violet-600 to-indigo-700 sm:h-24" />
          )}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
              {typeLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              via {sourceLabel}
            </span>
            {event.dateStatus === 'tbd' && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Date TBD
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold leading-tight text-gray-900">{event.name}</h2>

          {/* Genre */}
          {event.genre && (
            <p className="text-sm text-gray-500">
              {event.genre}{event.subGenre ? ` · ${event.subGenre}` : ''}
            </p>
          )}

          {/* Date + time */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{formatEventDate(event.startDate)}</span>
              {event.endDate && event.endDate !== event.startDate && (
                <span className="text-gray-400">– {formatEventDate(event.endDate)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{formatEventTime(event.startTime)}</span>
            </div>
          </div>

          {/* Price */}
          {event.priceRange && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.028 2.353 1.118V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.028-2.354-1.118V5z" clipRule="evenodd" />
              </svg>
              {formatPrice(event.priceRange.min, event.priceRange.max, event.priceRange.currency)}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="line-clamp-5 text-sm leading-relaxed text-gray-600">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Sticky CTA footer */}
        <div className="flex-shrink-0 border-t border-slate-100 bg-white p-4 pb-safe space-y-2">
          <div className="flex gap-2">
            <FavoriteButton event={event} size="md" />
            <button
              onClick={() => {
                trackEventClick(event.id, event.source)
                window.open(addUtm(event.url), '_blank', 'noopener,noreferrer')
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
              </svg>
              {buyLabel}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            We may earn a commission when you purchase through our links. No extra cost to you.
          </p>
        </div>
      </div>
    </>
  )
}
