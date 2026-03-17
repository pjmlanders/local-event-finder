import type { Request, Response, NextFunction } from 'express'
import { searchAllSources } from '../services/event-aggregator.service.js'
import { getTicketmasterEventById } from '../services/ticketmaster.service.js'
import { getSeatgeekEventById } from '../services/seatgeek.service.js'
import { getEventbriteEventById } from '../services/eventbrite.service.js'
import { getStubhubEventById } from '../services/stubhub.service.js'
import type { EventSearchQuery } from '../validators/events.schema.js'
import { logger } from '../utils/logger.js'
import { getSupabaseOptional } from '../config/supabase.js'

const EVENT_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  music: 'music',
  sports: 'sports',
  theatre: 'theatre',
  musical: 'theatre',
  comedy: 'comedy',
  family: 'family',
  film: 'film',
}

function nowIso(): string {
  // TM rejects milliseconds — strip them: "2026-02-24T06:02:11.500Z" → "2026-02-24T06:02:11Z"
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function formatDateForTM(dateStr: string): string {
  if (dateStr.includes('T')) return dateStr
  return `${dateStr}T00:00:00Z`
}

export async function searchEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery as EventSearchQuery

    const result = await searchAllSources({
      lat: query.lat,
      lng: query.lng,
      radius: query.radius,
      keyword: query.keyword,
      eventType: query.eventType,
      classificationName: query.eventType ? EVENT_TYPE_TO_CLASSIFICATION[query.eventType] : undefined,
      startDateTime: query.startDate ? formatDateForTM(query.startDate) : nowIso(),
      endDateTime: query.endDate ? formatDateForTM(query.endDate) : undefined,
      page: query.page,
      size: query.size,
      sort: query.sort,
    })

    let events = result.events

    if (query.eventType === 'musical') {
      events = events.filter(
        e => e.eventType === 'musical' || e.genre?.toLowerCase().includes('musical')
      )
    }

    res.json({
      data: events,
      pagination: {
        page: query.page,
        size: query.size,
        total: result.total,
        totalPages: Math.ceil(result.total / query.size),
      },
      sources: result.sources,
    })
  } catch (error) {
    next(error)
  }
}

export async function trackClick(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const { source } = req.body as { source?: string }
    const sourceVal = source ?? 'unknown'
    const ip = req.ip ?? null
    const userAgent = req.get('User-Agent') ?? null

    logger.info(
      { event: 'affiliate_click', eventId: id, source: sourceVal, ip },
      'Affiliate click-through'
    )

    const supabase = getSupabaseOptional()
    if (supabase) {
      await supabase.from('affiliate_clicks').insert({
        event_id: id,
        source: sourceVal,
        ip,
        user_agent: userAgent,
      })
    }

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

export async function getClickAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const supabase = getSupabaseOptional()
    if (!supabase) {
      res.json({ bySource: {}, total: 0, message: 'Analytics require Supabase.' })
      return
    }

    const { data: rows, error } = await supabase
      .from('affiliate_clicks')
      .select('source')
      .order('created_at', { ascending: false })

    if (error) {
      logger.warn({ err: error }, 'Affiliate clicks analytics query failed')
      res.status(500).json({ error: 'Failed to load analytics', bySource: {}, total: 0 })
      return
    }

    const bySource: Record<string, number> = {}
    for (const row of rows ?? []) {
      const s = row.source ?? 'unknown'
      bySource[s] = (bySource[s] ?? 0) + 1
    }
    res.json({
      bySource,
      total: rows?.length ?? 0,
    })
  } catch (error) {
    next(error)
  }
}

export async function getEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!id) {
      res.status(404).json({ error: 'Not Found', message: 'Event not found', statusCode: 404 })
      return
    }

    let event = null
    if (id.startsWith('tm_')) {
      event = await getTicketmasterEventById(id.slice(3))
    } else if (id.startsWith('sg_')) {
      event = await getSeatgeekEventById(id.slice(3))
    } else if (id.startsWith('eb_')) {
      event = await getEventbriteEventById(id.slice(3))
    } else if (id.startsWith('sh_')) {
      event = await getStubhubEventById(id.slice(3))
    }

    if (!event) {
      res.status(404).json({ error: 'Not Found', message: 'Event not found', statusCode: 404 })
      return
    }

    res.json(event)
  } catch (error) {
    next(error)
  }
}
