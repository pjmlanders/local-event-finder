import { useState } from 'react'
import { useLocation } from '../context/LocationContext'
import { useAiSearch } from '../hooks/useAiSearch'
import EventCard from '../components/events/EventCard'
import LocationPicker from '../components/search/LocationPicker'

const SUGGESTIONS = [
  'Concerts this weekend',
  'Sports near me',
  'Family shows this month',
  'Comedy tonight',
]

export default function AiSearchPage() {
  const { lat, lng, radius, status } = useLocation()
  const [query, setQuery] = useState('')
  const { mutate, data, isPending, error, isIdle } = useAiSearch()

  function handleSearch() {
    if (!query.trim() || !lat || !lng) return
    mutate({ query: query.trim(), lat, lng, radius })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  const hasLocation = status === 'success' && lat && lng

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <span className="text-4xl">✨</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">AI Event Search</h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Describe what you're looking for in plain English — AI will find the perfect events.
        </p>
      </div>

      {/* Location prompt if no location */}
      {!hasLocation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-800">Set your location to search nearby events</p>
          <LocationPicker />
        </div>
      )}

      {/* Search input */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Jazz concerts this weekend, family-friendly shows near me, outdoor music festivals..."
            rows={3}
            disabled={!hasLocation}
            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              disabled={!hasLocation}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={handleSearch}
          disabled={!hasLocation || !query.trim() || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Asking AI...
            </>
          ) : (
            <>
              <span>✨</span>
              Search with AI
            </>
          )}
        </button>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex gap-1">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-indigo-500" />
          </div>
          <p className="text-sm text-gray-500">Asking AI to find the best events for you... (3–5 seconds)</p>
          <p className="text-xs text-gray-400 italic">"{query}"</p>
        </div>
      )}

      {/* Error state */}
      {error && !isPending && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">{error.message}</p>
              {error.message.toLowerCase().includes('503') || error.message.toLowerCase().includes('unavailable') ? (
                <p className="mt-1 text-xs text-red-600">AI search is not configured on this server. Set ANTHROPIC_API_KEY in .env to enable.</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !isPending && (
        <div className="space-y-5">
          {/* AI Summary */}
          <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50 p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none">✨</span>
              <div>
                <p className="text-sm font-medium text-indigo-900">{data.aiSummary}</p>
              </div>
            </div>
          </div>

          {/* Result count */}
          <p className="text-sm text-gray-500">
            {data.events.length === 0
              ? 'No events found. Try a different search.'
              : `Found ${data.pagination.total} event${data.pagination.total !== 1 ? 's' : ''}`}
          </p>

          {/* Event grid */}
          {data.events.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {isIdle && !isPending && (
        <div className="py-8 text-center text-gray-400">
          <p className="text-sm">Enter a query above to get started</p>
        </div>
      )}
    </div>
  )
}
