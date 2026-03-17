import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { mapStubhubEvent } from '../utils/mapStubhub.js'
import type { ShTokenResponse, ShSearchResponse, ShEvent } from '../types/stubhub.types.js'
import type { UnifiedEvent } from 'shared'

const BASE_URL = 'https://api.stubhub.net'
const TOKEN_URL = 'https://account.stubhub.com/oauth2/token'

// ─── OAuth Token Cache ─────────────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const credentials = Buffer.from(
    `${env.STUBHUB_CLIENT_ID}:${env.STUBHUB_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=read:events',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`StubHub token request failed (${response.status}): ${body}`)
  }

  const data: ShTokenResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  logger.debug('StubHub OAuth token refreshed')
  return cachedToken
}

// ─── Category mapping ──────────────────────────────────────────────────────

// StubHub category IDs (approximate — verify in their catalog API)
const EVENT_TYPE_TO_SH_CATEGORY: Record<string, string> = {
  music:   '1',   // Concerts
  sports:  '3',   // Sports
  theatre: '2',   // Theater
  musical: '2',
  comedy:  '10',  // Comedy
  family:  '9',   // Family
  film:    '11',  // Film/Screenings
}

// ─── Search ───────────────────────────────────────────────────────────────

interface StubhubSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  eventType?: string
  startDateTime?: string
  endDateTime?: string
  page: number
  size: number
}

export async function searchStubhub(params: StubhubSearchParams): Promise<{
  events: UnifiedEvent[]
  total: number
}> {
  if (!env.STUBHUB_CLIENT_ID || !env.STUBHUB_CLIENT_SECRET) {
    logger.debug('STUBHUB_CLIENT_ID not configured, skipping StubHub search')
    return { events: [], total: 0 }
  }

  let token: string
  try {
    token = await getAccessToken()
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : err }, 'StubHub token fetch failed')
    return { events: [], total: 0 }
  }

  const url = new URL(`${BASE_URL}/catalog/events/v3`)
  url.searchParams.set('lat', String(params.lat))
  url.searchParams.set('lng', String(params.lng))
  url.searchParams.set('radius', String(params.radius))
  url.searchParams.set('radiusUnit', 'mi')
  url.searchParams.set('page', String(params.page + 1))  // 1-indexed
  url.searchParams.set('pageSize', String(Math.min(params.size, 100)))

  if (params.keyword) {
    url.searchParams.set('q', params.keyword)
  }
  if (params.startDateTime) {
    url.searchParams.set('startDate', params.startDateTime)
  }
  if (params.endDateTime) {
    url.searchParams.set('endDate', params.endDateTime)
  }
  if (params.eventType) {
    const catId = EVENT_TYPE_TO_SH_CATEGORY[params.eventType]
    if (catId) url.searchParams.set('categoryId', catId)
  }

  logger.info({ url: url.toString() }, 'Calling StubHub API')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    logger.error({ status: response.status, body }, 'StubHub API error')
    return { events: [], total: 0 }
  }

  const data: ShSearchResponse = await response.json()
  const rawEvents: ShEvent[] = data._embedded?.items ?? data.events ?? []

  const events = rawEvents
    .map(mapStubhubEvent)
    .filter((e): e is UnifiedEvent => e !== null)

  return {
    events,
    total: data.total_items ?? events.length,
  }
}

// ─── Single event lookup ───────────────────────────────────────────────────

export async function getStubhubEventById(sourceId: string): Promise<UnifiedEvent | null> {
  if (!env.STUBHUB_CLIENT_ID || !env.STUBHUB_CLIENT_SECRET) return null

  let token: string
  try {
    token = await getAccessToken()
  } catch {
    return null
  }

  const url = new URL(`${BASE_URL}/catalog/events/v3/${sourceId}`)
  logger.info({ sourceId }, 'Fetching single StubHub event')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    logger.warn({ status: response.status, sourceId }, 'StubHub single-event fetch failed')
    return null
  }

  const data: ShEvent = await response.json()
  return mapStubhubEvent(data)
}
