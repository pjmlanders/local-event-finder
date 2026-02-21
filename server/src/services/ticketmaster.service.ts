import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { mapTicketmasterEvent } from '../utils/mapTicketmaster.js'
import type { TmSearchResponse, TmEvent } from '../types/ticketmaster.types.js'
import type { UnifiedEvent } from 'shared'

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2'

interface TicketmasterSearchParams {
  lat: number
  lng: number
  radius: number
  keyword?: string
  classificationName?: string
  startDateTime?: string
  endDateTime?: string
  page: number
  size: number
  sort: string
}

const EVENT_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  music: 'music',
  sports: 'sports',
  theatre: 'theatre',
  musical: 'theatre',
  comedy: 'comedy',
  family: 'family',
  film: 'film',
}

function buildSortParam(sort: string): string {
  switch (sort) {
    case 'date': return 'date,asc'
    case 'relevance': return 'relevance,desc'
    case 'name': return 'name,asc'
    default: return 'date,asc'
  }
}

export async function searchTicketmaster(params: TicketmasterSearchParams): Promise<{
  events: UnifiedEvent[]
  total: number
}> {
  const url = new URL(`${BASE_URL}/events.json`)
  url.searchParams.set('apikey', env.TICKETMASTER_API_KEY)
  url.searchParams.set('latlong', `${params.lat},${params.lng}`)
  url.searchParams.set('radius', String(params.radius))
  url.searchParams.set('unit', 'miles')
  url.searchParams.set('size', String(params.size))
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('sort', buildSortParam(params.sort))

  if (params.keyword) {
    url.searchParams.set('keyword', params.keyword)
  }
  if (params.classificationName) {
    url.searchParams.set('classificationName', params.classificationName)
  }
  if (params.startDateTime) {
    url.searchParams.set('startDateTime', params.startDateTime)
  }
  if (params.endDateTime) {
    url.searchParams.set('endDateTime', params.endDateTime)
  }

  logger.info({ url: url.toString().replace(env.TICKETMASTER_API_KEY, '***') }, 'Calling Ticketmaster API')

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorText = await response.text()
    logger.error({ status: response.status, body: errorText }, 'Ticketmaster API error')
    throw new Error(`Ticketmaster API returned ${response.status}`)
  }

  const data: TmSearchResponse = await response.json()

  const rawEvents = data._embedded?.events ?? []
  const events = rawEvents
    .map(mapTicketmasterEvent)
    .filter((e): e is UnifiedEvent => e !== null)

  return {
    events,
    total: data.page.totalElements,
  }
}

export async function getTicketmasterEventById(sourceId: string): Promise<UnifiedEvent | null> {
  const url = new URL(`${BASE_URL}/events/${sourceId}.json`)
  url.searchParams.set('apikey', env.TICKETMASTER_API_KEY)

  logger.info({ sourceId }, 'Fetching single Ticketmaster event')
  const response = await fetch(url.toString())

  if (!response.ok) {
    logger.warn({ status: response.status, sourceId }, 'Ticketmaster single-event fetch failed')
    return null
  }

  const data: TmEvent = await response.json()
  return mapTicketmasterEvent(data)
}
