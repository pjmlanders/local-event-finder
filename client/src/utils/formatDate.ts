export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatEventTime(timeStr: string | null): string {
  if (!timeStr) return 'Time TBD'
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatEventDate(startDate)
  if (!endDate || endDate === startDate) return start
  const end = formatEventDate(endDate)
  return `${start} \u2013 ${end}`
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatPrice(min: number | null, max: number | null, currency: string): string {
  if (min === null && max === null) return 'Price TBD'
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency })
  if (min !== null && max !== null) {
    if (min === max) return fmt.format(min)
    return `${fmt.format(min)} - ${fmt.format(max)}`
  }
  if (min !== null) return `From ${fmt.format(min)}`
  return `Up to ${fmt.format(max!)}`
}
