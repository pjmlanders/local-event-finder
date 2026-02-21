import { useState } from 'react'
import { apiClient } from '../api/client'

interface CheckResult {
  status: 'idle' | 'running' | 'pass' | 'fail'
  message: string
  duration?: number
  data?: unknown
}

const DEFAULT_CHECK: CheckResult = { status: 'idle', message: 'Not run yet' }

export default function DiagnosticsPage() {
  const [checks, setChecks] = useState<Record<string, CheckResult>>({
    serverHealth: { ...DEFAULT_CHECK },
    eventSearch: { ...DEFAULT_CHECK },
    seatgeek: { ...DEFAULT_CHECK },
    geocoding: { ...DEFAULT_CHECK },
    claudeAi: { ...DEFAULT_CHECK },
  })

  function updateCheck(key: string, result: Partial<CheckResult>) {
    setChecks(prev => ({ ...prev, [key]: { ...prev[key], ...result } }))
  }

  async function runCheck(key: string, fn: () => Promise<{ message: string; data?: unknown }>) {
    updateCheck(key, { status: 'running', message: 'Running...' })
    const start = performance.now()
    try {
      const result = await fn()
      const duration = Math.round(performance.now() - start)
      updateCheck(key, { status: 'pass', message: result.message, duration, data: result.data })
    } catch (err) {
      const duration = Math.round(performance.now() - start)
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateCheck(key, { status: 'fail', message, duration })
    }
  }

  async function checkServerHealth() {
    await runCheck('serverHealth', async () => {
      const { data } = await apiClient.get('/health')
      return { message: `Server OK — ${data.timestamp}`, data }
    })
  }

  async function checkEventSearch() {
    await runCheck('eventSearch', async () => {
      const { data } = await apiClient.get('/events', {
        params: { lat: 38.88, lng: -77.17, radius: 25, size: 5 },
      })
      const count = data.pagination?.total ?? 0
      const sources = data.sources ?? {}
      const names = data.data?.map((e: { name: string }) => e.name).slice(0, 3) ?? []
      const sourceInfo = sources.ticketmaster != null
        ? ` (TM: ${sources.ticketmaster}, SG: ${sources.seatgeek ?? 0}, deduped: ${sources.duplicatesRemoved ?? 0})`
        : ''
      return {
        message: `${count} events found${sourceInfo}. Sample: ${names.join(', ') || 'none'}`,
        data: { total: count, sources, sample: data.data?.slice(0, 2) },
      }
    })
  }

  async function checkSeatgeek() {
    await runCheck('seatgeek', async () => {
      const { data } = await apiClient.get('/events', {
        params: { lat: 38.88, lng: -77.17, radius: 25, size: 3, keyword: 'concert' },
      })
      const sgCount = data.sources?.seatgeek ?? 0
      if (sgCount === 0 && (data.sources?.ticketmaster ?? 0) > 0) {
        throw new Error('SeatGeek returned 0 results. Ensure SEATGEEK_CLIENT_ID is set in .env')
      }
      const sgEvents = data.data?.filter((e: { source: string }) => e.source === 'seatgeek') ?? []
      const names = sgEvents.map((e: { name: string }) => e.name).slice(0, 3)
      return {
        message: `${sgCount} SeatGeek events. Sample: ${names.join(', ') || 'none'}`,
        data: { seatgeekCount: sgCount, sources: data.sources, sample: sgEvents.slice(0, 2) },
      }
    })
  }

  async function checkGeocoding() {
    await runCheck('geocoding', async () => {
      const { data } = await apiClient.get('/geocode', {
        params: { zip: '22046' },
      })
      return {
        message: `ZIP 22046 → lat: ${data.lat}, lng: ${data.lng} (${data.displayName})`,
        data,
      }
    })
  }

  async function checkClaudeAi() {
    await runCheck('claudeAi', async () => {
      try {
        const { data } = await apiClient.post('/ai/search', {
          query: 'Find jazz concerts this weekend',
          lat: 38.88,
          lng: -77.17,
          radius: 25,
        })
        return {
          message: `AI returned ${data.events?.length ?? 0} events. Summary: ${data.aiSummary?.slice(0, 120) ?? 'none'}`,
          data,
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
        if (axiosErr.response?.status === 503) {
          throw new Error('ANTHROPIC_API_KEY not configured in .env. Add your key and restart the server.')
        }
        if (axiosErr.response?.status === 404) {
          throw new Error('AI endpoint not registered. Restart the server to load new routes.')
        }
        throw err
      }
    })
  }

  async function runAll() {
    await checkServerHealth()
    await checkEventSearch()
    await checkSeatgeek()
    await checkGeocoding()
    await checkClaudeAi()
  }

  const CHECKS = [
    { key: 'serverHealth', label: 'Server Health', description: 'GET /api/health — Express server reachable', run: checkServerHealth },
    { key: 'eventSearch', label: 'Event Search (Aggregated)', description: 'Ticketmaster + SeatGeek combined with deduplication', run: checkEventSearch },
    { key: 'seatgeek', label: 'SeatGeek API', description: 'Verifies SeatGeek is returning results (requires SEATGEEK_CLIENT_ID)', run: checkSeatgeek },
    { key: 'geocoding', label: 'Geocoding (Nominatim)', description: 'ZIP code → lat/lng lookup via OpenStreetMap', run: checkGeocoding },
    { key: 'claudeAi', label: 'Claude AI Search', description: 'NL search + web discovery across all sources', run: checkClaudeAi },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Diagnostics</h2>
          <p className="text-sm text-gray-500">Check which services are working and returning results</p>
        </div>
        <button
          onClick={runAll}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Run All Checks
        </button>
      </div>

      <div className="space-y-4">
        {CHECKS.map(({ key, label, description, run }) => {
          const check = checks[key]
          return (
            <div key={key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between p-5">
                <div className="flex items-start gap-3">
                  <StatusIcon status={check.status} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                    <p className={`mt-1 text-sm ${check.status === 'fail' ? 'text-red-600' : check.status === 'pass' ? 'text-green-600' : 'text-gray-400'}`}>
                      {check.message}
                    </p>
                    {check.duration !== undefined && (
                      <p className="text-xs text-gray-400">{check.duration}ms</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={run}
                  disabled={check.status === 'running'}
                  className="flex-shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {check.status === 'running' ? 'Running...' : 'Run'}
                </button>
              </div>

              {check.data != null ? (
                <details className="border-t border-gray-100">
                  <summary className="cursor-pointer px-5 py-2 text-xs font-medium text-gray-500 hover:text-gray-700">
                    View raw response
                  </summary>
                  <pre className="max-h-64 overflow-auto bg-gray-50 px-5 py-3 text-xs text-gray-600">
                    {JSON.stringify(check.data, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: CheckResult['status'] }) {
  if (status === 'running') {
    return <div className="mt-0.5 h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
  }
  if (status === 'pass') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  }
  if (status === 'fail') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  )
}
