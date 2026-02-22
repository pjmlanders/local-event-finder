import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { UnifiedEvent } from 'shared'

const TYPE_COLORS: Record<string, string> = {
  music: '#a855f7',
  sports: '#22c55e',
  theatre: '#f59e0b',
  musical: '#ec4899',
  comedy: '#eab308',
  family: '#3b82f6',
  film: '#ef4444',
  other: '#6b7280',
}

export interface VenueGroup {
  key: string
  name: string
  lat: number
  lng: number
  events: UnifiedEvent[]
  primaryType: string
}

interface ClusterLayerProps {
  venueGroups: VenueGroup[]
  onVenueClick: (venueKey: string) => void
}

export default function ClusterLayer({ venueGroups, onVenueClick }: ClusterLayerProps) {
  const map = useMap()

  useEffect(() => {
    const clusterGroup = (L as unknown as { markerClusterGroup: () => L.LayerGroup }).markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    } as object)

    for (const group of venueGroups) {
      const color = TYPE_COLORS[group.primaryType] ?? TYPE_COLORS.other
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px; height: 32px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 11px; font-weight: 700;
          ">${group.events.length > 1 ? group.events.length : ''}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([group.lat, group.lng], { icon })
      marker.on('click', () => onVenueClick(group.key))
      clusterGroup.addLayer(marker)
    }

    map.addLayer(clusterGroup)

    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [map, venueGroups, onVenueClick])

  return null
}
