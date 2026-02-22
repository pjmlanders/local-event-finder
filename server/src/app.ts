import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { eventsRouter } from './routes/events.routes.js'
import { geocodeRouter } from './routes/geocode.routes.js'
import { aiRouter } from './routes/ai.routes.js'
import { usersRouter } from './routes/users.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  const allowedOrigins = [
    'http://localhost:5180',
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ]
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }))
  app.use(express.json())

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
  app.use('/api', limiter)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/events', eventsRouter)
  app.use('/api/geocode', geocodeRouter)
  app.use('/api/ai', aiRouter)
  app.use('/api/users', usersRouter)

  app.use(errorHandler)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found', message: 'Route not found', statusCode: 404 })
  })

  return app
}
