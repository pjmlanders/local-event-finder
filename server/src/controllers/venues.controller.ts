import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { searchAllSources } from '../services/event-aggregator.service.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const venueSearchSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().min(1).max(100).default(25),
  keyword: z.string().trim().optional(),
})

const venueEventsSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().min(1).max(150).default(50),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(50).default(25),
})

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/venues
 * Fetches a broad batch of events and extracts unique venues from them.
 */
export async function searchVenues(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = venueSearchSchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'Bad Request', message: parsed.error.flatten().fieldErrors })
      return
    }
    const { lat, lng, radius, keyword } = parsed.data

    const result = await searchAllSources({
      lat,
      lng,
      radius,
      keyword: keyword || undefined,
      startDateTime: nowIso(),
      page: 1,
      size: 200,
      sort: 'date',
    })

    // Group events by venue key
    const venueMap = new Map<
      string,
      {
        key: string
        name: string
        city: string
        state: string
        address: string | null
        postalCode: string | null
        latitude: number
        longitude: number
        distanceMiles: number
        eventCount: number
        eventTypes: string[]
        sampleEvents: Array<{ id: string; name: string; startDate: string }>
      }
    >()

    for (const event of result.events) {
      const v = event.venue
      const key = `${v.name}|${v.city}|${v.state}`
      const existing = venueMap.get(key)

      if (existing) {
        existing.eventCount++
        if (!existing.eventTypes.includes(event.eventType)) {
          existing.eventTypes.push(event.eventType)
        }
        if (existing.sampleEvents.length < 3) {
          existing.sampleEvents.push({
            id: event.id,
            name: event.name,
            startDate: event.startDate,
          })
        }
      } else {
        const dist = haversine(lat, lng, v.latitude, v.longitude)
        venueMap.set(key, {
          key,
          name: v.name,
          city: v.city,
          state: v.state,
          address: v.address,
          postalCode: v.postalCode,
          latitude: v.latitude,
          longitude: v.longitude,
          distanceMiles: Math.round(dist * 10) / 10,
          eventCount: 1,
          eventTypes: [event.eventType],
          sampleEvents: [{ id: event.id, name: event.name, startDate: event.startDate }],
        })
      }
    }

    const venues = Array.from(venueMap.values()).sort((a, b) => b.eventCount - a.eventCount)

    res.json({ data: venues, total: venues.length })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/venues/:venueKey/events
 * Returns upcoming events at a specific venue using its name as the search keyword.
 * venueKey is the URL-encoded "name|city|state" string.
 */
export async function getVenueEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = venueEventsSchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: 'Bad Request', message: parsed.error.flatten().fieldErrors })
      return
    }
    const { lat, lng, radius, page, size } = parsed.data

    const rawParam = req.params.venueKey ?? ''
    const rawKey = Array.isArray(rawParam) ? rawParam[0] : rawParam
    const venueKey = decodeURIComponent(rawKey)
    const venueName = venueKey.split('|')[0] ?? venueKey

    if (!venueName.trim()) {
      res.status(400).json({ error: 'Bad Request', message: 'venueKey is required' })
      return
    }

    const result = await searchAllSources({
      lat,
      lng,
      radius,
      keyword: venueName,
      startDateTime: nowIso(),
      page,
      size,
      sort: 'date',
    })

    res.json({
      data: result.events,
      pagination: {
        page,
        size,
        total: result.total,
        totalPages: Math.ceil(result.total / size),
      },
    })
  } catch (error) {
    next(error)
  }
}
