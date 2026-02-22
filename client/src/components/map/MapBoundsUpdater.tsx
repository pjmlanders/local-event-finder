import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { UnifiedEvent } from 'shared'

interface MapBoundsUpdaterProps {
  events: UnifiedEvent[]
}

export default function MapBoundsUpdater({ events }: MapBoundsUpdaterProps) {
  const map = useMap()

  useEffect(() => {
    const coords = events
      .filter(e => e.venue.latitude && e.venue.longitude)
      .map(e => [e.venue.latitude, e.venue.longitude] as [number, number])

    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 13 })
    }
  }, [map, events])

  return null
}
