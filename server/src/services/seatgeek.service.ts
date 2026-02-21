import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { mapSeatgeekEvent } from '../utils/mapSeatgeek.js'
import type { SgSearchResponse, SgEvent } from '../types/seatgeek.types.js'
import type { UnifiedEvent } from 'shared'

const BASE_URL = 'https://api.seatgeek.com/2'

interface SeatgeekSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  type?: string
  startDateTime?: string
  endDateTime?: string
  page: number
  size: number
  sort: string
}

const EVENT_TYPE_TO_SG_TYPE: Record<string, string> = {
  music: 'concert',
  sports: 'sports',
  theatre: 'theater',
  musical: 'theater',
  comedy: 'comedy',
  family: 'family',
  film: 'film',
}

function buildSortParam(sort: string): string {
  switch (sort) {
    case 'date': return 'datetime_local.asc'
    case 'relevance': return 'score.desc'
    case 'name': return 'name.asc'
    default: return 'datetime_local.asc'
  }
}

export async function searchSeatgeek(params: SeatgeekSearchParams): Promise<{
  events: UnifiedEvent[]
  total: number
}> {
  if (!env.SEATGEEK_CLIENT_ID) {
    logger.debug('SEATGEEK_CLIENT_ID not configured, skipping SeatGeek search')
    return { events: [], total: 0 }
  }

  const url = new URL(`${BASE_URL}/events`)
  url.searchParams.set('client_id', env.SEATGEEK_CLIENT_ID)
  url.searchParams.set('lat', String(params.lat))
  url.searchParams.set('lon', String(params.lng))
  url.searchParams.set('range', `${params.radius}mi`)
  url.searchParams.set('per_page', String(params.size))
  // SeatGeek pages are 1-indexed
  url.searchParams.set('page', String(params.page + 1))
  url.searchParams.set('sort', buildSortParam(params.sort))

  if (params.keyword) {
    url.searchParams.set('q', params.keyword)
  }
  if (params.type) {
    const sgType = EVENT_TYPE_TO_SG_TYPE[params.type]
    if (sgType) {
      url.searchParams.set('type', sgType)
    }
  }
  if (params.startDateTime) {
    // SeatGeek expects YYYY-MM-DDTHH:MM:SS format
    url.searchParams.set('datetime_utc.gte', params.startDateTime)
  }
  if (params.endDateTime) {
    url.searchParams.set('datetime_utc.lte', params.endDateTime)
  }

  logger.info({ url: url.toString().replace(env.SEATGEEK_CLIENT_ID, '***') }, 'Calling SeatGeek API')

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({ status: response.status, body: errorText }, 'SeatGeek API error')
    // Don't throw — gracefully return empty so Ticketmaster results still work
    return { events: [], total: 0 }
  }

  const data: SgSearchResponse = await response.json()

  const events = data.events
    .map(mapSeatgeekEvent)
    .filter((e): e is UnifiedEvent => e !== null)

  return {
    events,
    total: data.meta.total,
  }
}

export async function getSeatgeekEventById(sourceId: string): Promise<UnifiedEvent | null> {
  if (!env.SEATGEEK_CLIENT_ID) return null

  const url = new URL(`${BASE_URL}/events/${sourceId}`)
  url.searchParams.set('client_id', env.SEATGEEK_CLIENT_ID)

  logger.info({ sourceId }, 'Fetching single SeatGeek event')
  const response = await fetch(url.toString())

  if (!response.ok) {
    logger.warn({ status: response.status, sourceId }, 'SeatGeek single-event fetch failed')
    return null
  }

  const data: SgEvent = await response.json()
  return mapSeatgeekEvent(data)
}
