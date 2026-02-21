import type { Request, Response, NextFunction } from 'express'
import { searchAllSources } from '../services/event-aggregator.service.js'
import { getTicketmasterEventById } from '../services/ticketmaster.service.js'
import { getSeatgeekEventById } from '../services/seatgeek.service.js'
import type { EventSearchQuery } from '../validators/events.schema.js'

const EVENT_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  music: 'music',
  sports: 'sports',
  theatre: 'theatre',
  musical: 'theatre',
  comedy: 'comedy',
  family: 'family',
  film: 'film',
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
      startDateTime: query.startDate ? formatDateForTM(query.startDate) : new Date().toISOString(),
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
