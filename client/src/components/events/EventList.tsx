import type { UnifiedEvent } from 'shared'
import EventCard from './EventCard'
import { formatEventDate } from '../../utils/formatDate'
import { groupEventsByShow } from '../../utils/groupEvents'
import type { ViewMode } from './DayShowToggle'

interface EventListProps {
  events: UnifiedEvent[]
  viewMode: ViewMode
}

function groupByDay(events: UnifiedEvent[]): Map<string, UnifiedEvent[]> {
  const groups = new Map<string, UnifiedEvent[]>()
  for (const event of events) {
    const key = event.startDate
    const existing = groups.get(key) ?? []
    existing.push(event)
    groups.set(key, existing)
  }
  return groups
}

export default function EventList({ events, viewMode }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-4 text-gray-500">No events found</p>
        <p className="text-sm text-gray-400">Try adjusting your filters or expanding the radius</p>
      </div>
    )
  }

  if (viewMode === 'day') {
    const grouped = groupByDay(events)
    return (
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <span className="h-px flex-1 bg-gray-200" />
              {formatEventDate(date)}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{dayEvents.length}</span>
              <span className="h-px flex-1 bg-gray-200" />
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // "By Show" mode
  const grouped = groupEventsByShow(events)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {grouped.map((group) => (
        <EventCard
          key={`${group.event.id}-${group.firstDate}`}
          event={group.event}
          showDates
          dateRange={group.firstDate !== group.lastDate ? { from: group.firstDate, to: group.lastDate } : undefined}
          showCount={group.showCount > 1 ? group.showCount : undefined}
        />
      ))}
    </div>
  )
}
