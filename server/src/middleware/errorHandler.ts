import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error')

  const statusCode = 'statusCode' in err ? (err as { statusCode: number }).statusCode : 500
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message,
    statusCode,
  })
}
