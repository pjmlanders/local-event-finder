import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

interface ClickAnalytics {
  bySource: Record<string, number>
  total: number
  message?: string
}

const SOURCE_LABELS: Record<string, string> = {
  ticketmaster: 'Ticketmaster',
  seatgeek: 'SeatGeek',
  stubhub: 'StubHub',
  eventbrite: 'Eventbrite',
  unknown: 'Unknown',
}

const ALL_SOURCES = ['ticketmaster', 'seatgeek', 'stubhub', 'eventbrite', 'unknown']

async function fetchClickAnalytics(): Promise<ClickAnalytics> {
  const { data } = await apiClient.get<ClickAnalytics>('/events/analytics/clicks')
  return data
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'clicks'],
    queryFn: fetchClickAnalytics,
    staleTime: 60_000,
    retry: 1,
  })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Click-Through Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Revenue tracking by source</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load analytics:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Total */}
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Clicks</p>
            <p className="mt-1 text-4xl font-bold text-slate-900">{data.total.toLocaleString()}</p>
          </div>

          {/* Breakdown table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left font-semibold text-slate-600">Source</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-600">Clicks</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-600">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_SOURCES.map(source => {
                  const count = data.bySource[source] ?? 0
                  const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                  return (
                    <tr key={source} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {SOURCE_LABELS[source] ?? source}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-700">
                        {count.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-500">
                        {pct}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Supabase not configured note */}
          {data.message && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {data.message}
            </div>
          )}

          {!data.message && (
            <p className="text-center text-xs text-slate-400">
              Clicks are recorded once <code className="font-mono">SUPABASE_URL</code> and{' '}
              <code className="font-mono">SUPABASE_SERVICE_KEY</code> are configured.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
