import type { UnifiedEvent } from 'shared'

export interface GroupedEvent {
  /** The representative event (first chronologically) */
  event: UnifiedEvent
  /** All dates this show occurs */
  dates: string[]
  /** Earliest start date */
  firstDate: string
  /** Latest start date (or end date) */
  lastDate: string
  /** Number of individual performances */
  showCount: number
}

function groupKey(event: UnifiedEvent): string {
  const name = event.name.trim().toLowerCase()
  const venue = event.venue.name.trim().toLowerCase()
  return `${name}||${venue}`
}

export function groupEventsByShow(events: UnifiedEvent[]): GroupedEvent[] {
  const groups = new Map<string, UnifiedEvent[]>()

  for (const event of events) {
    const key = groupKey(event)
    const existing = groups.get(key) ?? []
    existing.push(event)
    groups.set(key, existing)
  }

  const result: GroupedEvent[] = []

  for (const members of groups.values()) {
    // Sort by start date
    members.sort((a, b) => a.startDate.localeCompare(b.startDate))

    const first = members[0]
    const last = members[members.length - 1]

    const dates = [...new Set(members.map(m => m.startDate))].sort()

    // The last date is either the last event's end date or its start date
    const lastDate = last.endDate && last.endDate > last.startDate
      ? last.endDate
      : last.startDate

    result.push({
      event: first,
      dates,
      firstDate: first.startDate,
      lastDate,
      showCount: members.length,
    })
  }

  // Sort grouped results by first date
  result.sort((a, b) => a.firstDate.localeCompare(b.firstDate))

  return result
}
