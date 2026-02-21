import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export async function geocodeZip(req: Request, res: Response, next: NextFunction) {
  try {
    const { zip } = res.locals.validatedQuery as { zip: string }

    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LocalEventFinder/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim returned ${response.status}`)
    }

    const results = await response.json()

    if (!Array.isArray(results) || results.length === 0) {
      res.status(404).json({
        error: 'Not Found',
        message: `No location found for ZIP code ${zip}`,
        statusCode: 404,
      })
      return
    }

    const { lat, lon, display_name } = results[0]

    res.json({
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      displayName: display_name,
      zip,
    })
  } catch (err) {
    logger.error({ err }, 'Geocoding error')
    next(err)
  }
}
