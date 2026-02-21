import { Link } from 'react-router-dom'
import type { UnifiedEvent } from 'shared'
import { formatShortDate, formatDayOfWeek, formatEventTime, formatDateRange, formatPrice } from '../../utils/formatDate'

const TYPE_COLORS: Record<string, string> = {
  music: 'bg-purple-500',
  sports: 'bg-green-500',
  theatre: 'bg-amber-500',
  musical: 'bg-pink-500',
  comedy: 'bg-yellow-500',
  family: 'bg-blue-500',
  film: 'bg-red-500',
  other: 'bg-gray-500',
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

const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: 'TM',
  seatgeek: 'SG',
  web: 'Web',
}

const SOURCE_COLORS: Record<string, string> = {
  ticketmaster: 'bg-blue-50 text-blue-600',
  seatgeek: 'bg-emerald-50 text-emerald-600',
  web: 'bg-orange-50 text-orange-600',
}

interface EventCardProps {
  event: UnifiedEvent
  compact?: boolean
  showDates?: boolean
  dateRange?: { from: string; to: string }
  showCount?: number
  featured?: boolean
}

export default function EventCard({ event, compact = false, showDates = false, dateRange, showCount, featured = false }: EventCardProps) {
  const typeColor = TYPE_COLORS[event.eventType] ?? TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[event.eventType] ?? 'Event'

  function getDateDisplay(): string {
    if (dateRange) return formatDateRange(dateRange.from, dateRange.to)
    if (showDates && event.endDate && event.endDate !== event.startDate) {
      return formatDateRange(event.startDate, event.endDate)
    }
    return `${formatDayOfWeek(event.startDate)}, ${formatShortDate(event.startDate)}`
  }

  // Compact row for list contexts
  if (compact) {
    return (
      <Link
        to={`/event/${event.id}`}
        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-indigo-300 hover:shadow-sm"
      >
        <div className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg ${typeColor} text-white`}>
          <span className="text-[10px] font-bold uppercase leading-none">{formatDayOfWeek(event.startDate)}</span>
          <span className="text-sm font-bold leading-tight">{new Date(event.startDate + 'T00:00:00').getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-900">{event.name}</h4>
          <p className="truncate text-xs text-gray-500">{event.venue.name} &middot; {formatEventTime(event.startTime)}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </Link>
    )
  }

  // Featured large card (horizontal on desktop)
  if (featured) {
    return (
      <Link
        to={`/event/${event.id}`}
        className="group block overflow-hidden rounded-2xl bg-gray-900 shadow-lg transition-all hover:shadow-xl"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative h-48 w-full sm:h-auto sm:w-1/2">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className={`flex h-full items-center justify-center ${typeColor}`}>
                <span className="text-4xl font-bold text-white/30">{typeLabel}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r" />
          </div>
          <div className="flex flex-col justify-center p-6 sm:w-1/2">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${typeColor}`} />
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">{typeLabel}{event.genre ? ` / ${event.genre}` : ''}</span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-white group-hover:text-indigo-300 sm:text-2xl">{event.name}</h3>
            <div className="mb-1 flex items-center gap-1.5 text-sm text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {event.venue.name} &middot; {event.venue.city}, {event.venue.state}
            </div>
            <div className="mb-4 flex items-center gap-1.5 text-sm text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {getDateDisplay()} &middot; {formatEventTime(event.startTime)}
            </div>
            <div className="flex items-center gap-3">
              {event.priceRange ? (
                <span className="text-sm font-semibold text-white">{formatPrice(event.priceRange.min, event.priceRange.max, event.priceRange.currency)}</span>
              ) : (
                <span className="text-sm text-gray-500">Price TBD</span>
              )}
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-indigo-500">
                View Details
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Default: grid card (vertical)
  return (
    <Link
      to={`/event/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className={`flex h-full items-center justify-center ${typeColor}`}>
            <span className="text-2xl font-bold text-white/40">{typeLabel}</span>
          </div>
        )}
        {/* Type dot & label */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <span className={`h-2 w-2 rounded-full ${typeColor}`} />
          <span className="text-[11px] font-medium text-white">{typeLabel}</span>
        </div>
        {/* Show count badge */}
        {showCount && showCount > 1 && (
          <div className="absolute right-2.5 top-2.5 rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
            {showCount} shows
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Date row */}
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          {getDateDisplay()} &middot; {formatEventTime(event.startTime)}
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-indigo-600">
          {event.name}
        </h3>

        {/* Venue */}
        <p className="mb-auto line-clamp-1 text-xs text-gray-500">
          {event.venue.name} &middot; {event.venue.city}, {event.venue.state}
        </p>

        {/* Price + Source */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
          <div className="flex items-center gap-2">
            {event.priceRange ? (
              <span className="text-xs font-semibold text-gray-900">
                {formatPrice(event.priceRange.min, event.priceRange.max, event.priceRange.currency)}
              </span>
            ) : (
              <span className="text-xs text-gray-400">Price TBD</span>
            )}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[event.source] ?? 'bg-gray-50 text-gray-500'}`}>
              {SOURCE_LABELS[event.source] ?? event.source}
            </span>
          </div>
          <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
            Details &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
