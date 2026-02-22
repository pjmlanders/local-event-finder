import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import { getPreferences, updatePreferences } from '../api/users'
import { EVENT_TYPES, RADIUS_OPTIONS } from '../lib/constants'
import type { EventType } from 'shared'

export default function SettingsPage() {
  const { user } = useAuth()
  const { lat, lng, radius: currentRadius, method, label } = useLocation()
  const queryClient = useQueryClient()

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: getPreferences,
    staleTime: 5 * 60 * 1000,
  })

  const [defaultRadius, setDefaultRadius] = useState(25)
  const [preferredTypes, setPreferredTypes] = useState<EventType[]>([])
  const [notifications, setNotifications] = useState(false)
  const [saved, setSaved] = useState(false)

  // Populate form from loaded prefs
  useEffect(() => {
    if (prefs) {
      setDefaultRadius(prefs.defaultRadiusMiles)
      setPreferredTypes(prefs.preferredEventTypes)
      setNotifications(prefs.notificationsEnabled)
    }
  }, [prefs])

  const { mutate, isPending } = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  function toggleType(type: EventType) {
    setPreferredTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function saveCurrentLocation() {
    if (method !== 'none' && lat && lng) {
      mutate({
        defaultLatitude: lat,
        defaultLongitude: lng,
        defaultZipCode: method === 'zip' ? label.replace('ZIP ', '') : prefs?.defaultZipCode ?? null,
        defaultRadiusMiles: defaultRadius,
        preferredEventTypes: preferredTypes,
        notificationsEnabled: notifications,
      })
    }
  }

  function handleSave() {
    mutate({
      defaultLatitude: prefs?.defaultLatitude ?? null,
      defaultLongitude: prefs?.defaultLongitude ?? null,
      defaultZipCode: prefs?.defaultZipCode ?? null,
      defaultRadiusMiles: defaultRadius,
      preferredEventTypes: preferredTypes,
      notificationsEnabled: notifications,
    })
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-gray-200" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Location defaults */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Default Location</h2>
        <p className="text-sm text-gray-500">
          {prefs?.defaultZipCode
            ? `Current default: ZIP ${prefs.defaultZipCode}`
            : prefs?.defaultLatitude
            ? `Current default: ${prefs.defaultLatitude.toFixed(4)}, ${prefs.defaultLongitude?.toFixed(4)}`
            : 'No default location saved yet'}
        </p>
        <button
          onClick={saveCurrentLocation}
          disabled={method === 'none' || !lat || !lng || isPending}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {method !== 'none' && label
            ? `Save current location (${label})`
            : 'Set a location in Search first'}
        </button>
        <p className="text-xs text-gray-400">Radius: {currentRadius} mi (from current session)</p>
      </div>

      {/* Default radius */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Default Search Radius</h2>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => setDefaultRadius(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                defaultRadius === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>

      {/* Preferred event types */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900">Preferred Event Types</h2>
        <p className="text-sm text-gray-500">Used for personalized recommendations</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => toggleType(type.value as EventType)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                preferredTypes.includes(type.value as EventType)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500 mt-0.5">Push notifications for new matching events (coming soon)</p>
          </div>
          <button
            onClick={() => setNotifications(n => !n)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              notifications ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={notifications}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save preferences'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Saved!
          </span>
        )}
      </div>
    </div>
  )
}
