import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import { useEvents } from '../hooks/useEvents'
import SearchBar from '../components/search/SearchBar'
import DateFilter from '../components/search/DateFilter'
import EventTypeChips from '../components/search/EventTypeChips'
import RadiusSlider from '../components/search/RadiusSlider'
import DayShowToggle, { type ViewMode } from '../components/events/DayShowToggle'
import EventList from '../components/events/EventList'
import Pagination from '../components/ui/Pagination'
import LocationPicker from '../components/search/LocationPicker'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { lat, lng, radius, status } = useLocation()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const keyword = searchParams.get('q') ?? ''
  const eventType = searchParams.get('type') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''
  const page = parseInt(searchParams.get('page') ?? '0', 10)
  const [viewMode, setViewMode] = useState<ViewMode>('day')

  const hasLocation = lat !== 0 || lng !== 0

  const params = useMemo(() => {
    if (!hasLocation) return null
    return {
      lat,
      lng,
      radius,
      keyword: keyword || undefined,
      eventType: eventType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      size: 20,
    }
  }, [lat, lng, radius, keyword, eventType, startDate, endDate, page, hasLocation])

  const { data, isLoading, error } = useEvents(params)

  function updateParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.delete('page')
      return next
    })
  }

  function handlePageChange(newPage: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newPage > 0) {
        next.set('page', String(newPage))
      } else {
        next.delete('page')
      }
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilterCount = [keyword, eventType, startDate, endDate].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Location prompt */}
      {(!hasLocation || status === 'error') && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Set Your Location</h2>
          <LocationPicker />
        </section>
      )}

      {hasLocation && (
        <>
          {/* Search + Filter Bar */}
          <section className="sticky top-0 z-10 -mx-4 bg-gray-50 px-4 pb-3 pt-1">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              {/* Top row: search + toggle */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchBar value={keyword} onChange={(v) => updateParam('q', v)} />
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    filtersOpen || activeFilterCount > 0
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <DayShowToggle mode={viewMode} onChange={setViewMode} />
              </div>

              {/* Expandable filters */}
              {filtersOpen && (
                <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap items-end gap-4">
                    <RadiusSlider />
                    <DateFilter
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={(v) => updateParam('startDate', v)}
                      onEndDateChange={(v) => updateParam('endDate', v)}
                    />
                  </div>
                  <EventTypeChips selected={eventType} onChange={(v) => updateParam('type', v)} />
                </div>
              )}
            </div>
          </section>

          {/* Results header */}
          {data && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{data.pagination.total.toLocaleString()}</span> events found
              </p>
              {data.sources && (data.sources.ticketmaster > 0 || data.sources.seatgeek > 0) && (
                <p className="text-xs text-gray-400">
                  From {[data.sources.ticketmaster > 0 && 'Ticketmaster', data.sources.seatgeek > 0 && 'SeatGeek'].filter(Boolean).join(' & ')}
                  {data.sources.duplicatesRemoved > 0 && (
                    <span> · {data.sources.duplicatesRemoved} duplicate{data.sources.duplicatesRemoved === 1 ? '' : 's'} removed</span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="mt-4 text-sm text-gray-500">Finding events near you...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-red-700">
              <p className="font-medium">Error loading events</p>
              <p className="text-sm">{error instanceof Error ? error.message : 'Something went wrong'}</p>
            </div>
          )}

          {/* Results */}
          {data && (
            <>
              <EventList events={data.data} viewMode={viewMode} />
              <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
