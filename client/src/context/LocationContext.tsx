import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface LocationState {
  lat: number
  lng: number
  radius: number
  method: 'gps' | 'zip' | 'none'
  label: string
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage: string | null
}

interface LocationContextValue extends LocationState {
  setRadius: (radius: number) => void
  detectGPS: () => void
  searchZip: (zip: string) => Promise<void>
  clearLocation: () => void
}

const STORAGE_KEY = 'eventfinder_location'

const defaultState: LocationState = {
  lat: 0,
  lng: 0,
  radius: 25,
  method: 'none',
  label: '',
  status: 'idle',
  errorMessage: null,
}

function loadSaved(): LocationState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as LocationState
      if (parsed.lat && parsed.lng) return { ...parsed, status: 'success', errorMessage: null }
    }
  } catch { /* ignore */ }
  return defaultState
}

function save(state: LocationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lat: state.lat,
      lng: state.lng,
      radius: state.radius,
      method: state.method,
      label: state.label,
    }))
  } catch { /* ignore */ }
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>(loadSaved)

  useEffect(() => {
    if (state.status === 'success') save(state)
  }, [state])

  const setRadius = useCallback((radius: number) => {
    setState(prev => ({ ...prev, radius }))
  }, [])

  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, status: 'error', errorMessage: 'Geolocation is not supported by your browser' }))
      return
    }
    setState(prev => ({ ...prev, status: 'loading', errorMessage: null }))
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          method: 'gps',
          label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          status: 'success',
          errorMessage: null,
        }))
      },
      (error) => {
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: error.code === 1 ? 'Location permission denied' : 'Could not detect location',
        }))
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }, [])

  const searchZip = useCallback(async (zip: string) => {
    if (!zip || zip.length < 5) return
    setState(prev => ({ ...prev, status: 'loading', errorMessage: null }))
    try {
      const response = await fetch(`/api/geocode?zip=${encodeURIComponent(zip)}`)
      if (response.status === 404) {
        setState(prev => ({ ...prev, status: 'error', errorMessage: 'ZIP code not found' }))
        return
      }
      if (!response.ok) throw new Error('Geocoding failed')
      const data = await response.json()
      setState(prev => ({
        ...prev,
        lat: data.lat,
        lng: data.lng,
        method: 'zip',
        label: `ZIP ${zip}`,
        status: 'success',
        errorMessage: null,
      }))
    } catch {
      setState(prev => ({ ...prev, status: 'error', errorMessage: 'Failed to geocode ZIP code' }))
    }
  }, [])

  const clearLocation = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <LocationContext.Provider value={{ ...state, setRadius, detectGPS, searchZip, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (!context) throw new Error('useLocation must be used within LocationProvider')
  return context
}
