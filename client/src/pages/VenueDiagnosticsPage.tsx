import { useState } from 'react'
import { useLocation } from '../context/LocationContext'
import { apiClient } from '../api/client'
import type { UnifiedEvent } from 'shared'
import LocationPicker from '../components/search/LocationPicker'

interface VenueInfo {
  name: string
  city: string
  state: string
  lat: number
  lng: number
  eventCount: number
  eventTypes: Set<string>
  eventSources: Set<string>
  sampleEvents: string[]
  distanceMi: number | null
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type SortKey = 'name' | 'events' | 'distance'

export default function VenueDiagnosticsPage() {
  const { lat, lng, radius, status } = useLocation()
  const hasLocation = lat !== 0 || lng !== 0

  const [venues, setVenues] = useState<VenueInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [totalEvents, setTotalEvents] = useState(0)
  const [searchRadius, setSearchRadius] = useState(radius)
  const [sortBy, setSortBy] = useState<SortKey>('events')
  const [filterText, setFilterText] = useState('')

  async function scanVenues() {
    if (!hasLocation) return
    setLoading(true)
    setVenues([])
    setTotalEvents(0)

    const venueMap = new Map<string, VenueInfo>()
    let totalEventsFound = 0

    try {
      // Fetch multiple pages to get comprehensive venue coverage
      const pagesToFetch = 10
      const pageSize = 100

      for (let page = 0; page < pagesToFetch; page++) {
        setProgress(`Fetching page ${page + 1} of ${pagesToFetch}...`)

        const { data } = await apiClient.get('/events', {
          params: { lat, lng, radius: searchRadius, size: pageSize, page, sort: 'date' },
        })

        const events: UnifiedEvent[] = data.data ?? []
        const pageTotal: number = data.pagination?.total ?? 0

        if (page === 0) totalEventsFound = pageTotal

        for (const event of events) {
          const key = `${event.venue.name}|${event.venue.city}|${event.venue.state}`
          const existing = venueMap.get(key)
          if (existing) {
            existing.eventCount++
            existing.eventTypes.add(event.eventType)
            existing.eventSources.add(event.source)
            if (existing.sampleEvents.length < 3 && !existing.sampleEvents.includes(event.name)) {
              existing.sampleEvents.push(event.name)
            }
          } else {
            const dist = (event.venue.latitude && event.venue.longitude)
              ? haversineDistance(lat, lng, event.venue.latitude, event.venue.longitude)
              : null
            venueMap.set(key, {
              name: event.venue.name,
              city: event.venue.city,
              state: event.venue.state,
              lat: event.venue.latitude ?? 0,
              lng: event.venue.longitude ?? 0,
              eventCount: 1,
              eventTypes: new Set([event.eventType]),
              eventSources: new Set([event.source]),
              sampleEvents: [event.name],
              distanceMi: dist !== null ? Math.round(dist * 10) / 10 : null,
            })
          }
        }

        // Stop early if we've fetched all available events
        if (events.length < pageSize) break

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300))
      }

      setTotalEvents(totalEventsFound)
      setVenues(Array.from(venueMap.values()))
      setProgress('')
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const sortedVenues = [...venues]
    .filter(v => !filterText || v.name.toLowerCase().includes(filterText.toLowerCase()) || v.city.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'events') return b.eventCount - a.eventCount
      if (sortBy === 'distance') return (a.distanceMi ?? 999) - (b.distanceMi ?? 999)
      return a.name.localeCompare(b.name)
    })

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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Venue Coverage</h2>
        <p className="text-sm text-gray-500">See which venues are returning results in your area to diagnose search coverage</p>
      </div>

      {/* Location prompt */}
      {(!hasLocation || status === 'error') && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Set Your Location First</h3>
          <LocationPicker />
        </section>
      )}

      {hasLocation && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Scan Radius</label>
              <div className="flex gap-1">
                {[10, 25, 50, 100].map(r => (
                  <button
                    key={r}
                    onClick={() => setSearchRadius(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      searchRadius === r
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={scanVenues}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Scanning...' : 'Scan Venues'}
            </button>
            {progress && (
              <span className="text-sm text-gray-500">{progress}</span>
            )}
          </div>

          {/* Summary */}
          {venues.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-indigo-600">{venues.length}</p>
                <p className="text-xs text-gray-500">Unique Venues</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-indigo-600">{totalEvents.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Events</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-indigo-600">{searchRadius} mi</p>
                <p className="text-xs text-gray-500">Search Radius</p>
              </div>
            </div>
          )}

          {/* Filter + Sort */}
          {venues.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter venues..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex gap-1">
                {([['events', 'By Events'], ['distance', 'By Distance'], ['name', 'A-Z']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">{sortedVenues.length} of {venues.length} venues</span>
            </div>
          )}

          {/* Venue List */}
          {sortedVenues.length > 0 && (
            <div className="space-y-2">
              {sortedVenues.map(venue => (
                <div key={`${venue.name}|${venue.city}|${venue.state}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-semibold text-gray-900">{venue.name}</h4>
                        <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          {venue.eventCount} event{venue.eventCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {venue.city}, {venue.state}
                        {venue.distanceMi !== null && (
                          <span className="text-gray-400"> &middot; {venue.distanceMi} mi away</span>
                        )}
                      </p>
                      {/* Event type + source badges */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(venue.eventTypes).map(type => (
                          <span
                            key={type}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type] ?? TYPE_COLORS.other}`}
                          >
                            {type}
                          </span>
                        ))}
                        {Array.from(venue.eventSources).map(source => (
                          <span
                            key={source}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              source === 'ticketmaster' ? 'bg-blue-50 text-blue-600' :
                              source === 'seatgeek' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-orange-50 text-orange-600'
                            }`}
                          >
                            {source === 'ticketmaster' ? 'Ticketmaster' : source === 'seatgeek' ? 'SeatGeek' : 'Web'}
                          </span>
                        ))}
                      </div>
                      {/* Sample events */}
                      <div className="mt-2 text-xs text-gray-400">
                        {venue.sampleEvents.join(' · ')}
                      </div>
                    </div>
                    {venue.lat !== 0 && venue.lng !== 0 && (
                      <div className="flex-shrink-0 text-right text-[10px] text-gray-400">
                        {venue.lat.toFixed(4)}<br />{venue.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
