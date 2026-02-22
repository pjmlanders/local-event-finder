import { useState, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import { useEvents } from '../hooks/useEvents'
import ClusterLayer, { type VenueGroup } from '../components/map/ClusterLayer'
import MapBoundsUpdater from '../components/map/MapBoundsUpdater'
import MapFilterBar from '../components/map/MapFilterBar'
import EventCard from '../components/events/EventCard'
import type { UnifiedEvent } from 'shared'

function buildVenueKey(event: UnifiedEvent): string {
  return `${event.venue.name}|${event.venue.latitude}|${event.venue.longitude}`
}

function groupEventsByVenue(events: UnifiedEvent[]): VenueGroup[] {
  const map = new Map<string, VenueGroup>()
  for (const event of events) {
    const key = buildVenueKey(event)
    if (!event.venue.latitude || !event.venue.longitude) continue
    if (map.has(key)) {
      map.get(key)!.events.push(event)
    } else {
      map.set(key, {
        key,
        name: event.venue.name,
        lat: event.venue.latitude,
        lng: event.venue.longitude,
        events: [event],
        primaryType: event.eventType,
      })
    }
  }
  return Array.from(map.values())
}

export default function MapPage() {
  const { lat, lng, radius, status } = useLocation()
  const [selectedVenueKey, setSelectedVenueKey] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('')

  const params = status === 'success' && lat && lng
    ? { lat, lng, radius, eventType: selectedType || undefined, size: 100 }
    : null

  const { data, isLoading } = useEvents(params)
  const events = data?.events ?? []

  const venueGroups = useMemo(() => groupEventsByVenue(events), [events])

  const selectedGroup = selectedVenueKey
    ? venueGroups.find(g => g.key === selectedVenueKey) ?? null
    : null

  if (status === 'idle' || status === 'error' || !lat || !lng) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-gray-700">Set your location first</h2>
          <p className="mb-4 text-sm text-gray-500">Use the search page to set a location, then come back to view the map.</p>
          <Link to="/search" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Go to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden">
      <MapContainer
        center={[lat, lng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClusterLayer venueGroups={venueGroups} onVenueClick={setSelectedVenueKey} />
        {events.length > 0 && <MapBoundsUpdater events={events} />}
      </MapContainer>

      <MapFilterBar selectedType={selectedType} onTypeChange={setSelectedType} />

      {isLoading && (
        <div className="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-lg">
          Loading events...
        </div>
      )}

      {/* Venue side panel */}
      <div
        className={`absolute right-0 top-0 z-[1000] h-full w-80 sm:w-96 bg-white shadow-xl transition-transform duration-300 ${
          selectedGroup ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedGroup && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 p-4">
              <div className="min-w-0 pr-2">
                <h2 className="font-semibold text-gray-900 leading-snug">{selectedGroup.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedGroup.events.length} {selectedGroup.events.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              <button
                onClick={() => setSelectedVenueKey(null)}
                className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Close panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedGroup.events.map(event => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
