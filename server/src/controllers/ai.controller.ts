import type { Request, Response, NextFunction } from 'express'
import { aiSearchEvents } from '../services/claude-ai.service.js'
import { logger } from '../utils/logger.js'

export async function aiSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const { query, lat, lng, radius } = req.body as {
      query: string
      lat: number
      lng: number
      radius: number
    }

    const result = await aiSearchEvents(query, lat, lng, radius)

    res.json({
      events: result.events,
      aiSummary: result.aiSummary,
      extractedParams: result.extractedParams,
      pagination: {
        total: result.totalResults,
        page: 0,
        size: 20,
        totalPages: Math.ceil(result.totalResults / 20),
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY is not configured') {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI search is not configured. Set ANTHROPIC_API_KEY in .env to enable.',
        statusCode: 503,
      })
      return
    }
    logger.error({ err }, 'AI search error')
    next(err)
  }
}
