import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { eventsRouter } from './routes/events.routes.js'
import { venuesRouter } from './routes/venues.routes.js'
import { geocodeRouter } from './routes/geocode.routes.js'
import { aiRouter } from './routes/ai.routes.js'
import { usersRouter } from './routes/users.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'

export function createApp() {
  const app = express()

  // ─── Security headers ──────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: [
          "'self'",
          "https://*.firebaseio.com",
          "https://*.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://*.supabase.co",
          ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
        ],
        frameSrc: ["https://accounts.google.com", "https://*.firebaseapp.com"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for cross-origin images (event posters)
  }))

  // ─── CORS ──────────────────────────────────────────────────────────────────
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

  // ─── Body parsing with size limit ─────────────────────────────────────────
  app.use(express.json({ limit: '16kb' }))

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  // General API rate limit
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })

  // Strict limiter for auth endpoints (prevent credential stuffing)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'TooManyRequests', message: 'Too many requests. Please try again later.', statusCode: 429 },
  })

  // Strict limiter for AI search (protects Anthropic API spend)
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'TooManyRequests', message: 'AI search rate limit reached. Please try again later.', statusCode: 429 },
  })

  app.use('/api', generalLimiter)
  app.use('/api/users/sync', authLimiter)
  app.use('/api/ai', aiLimiter)

  // ─── Auth event logging ────────────────────────────────────────────────────
  app.use('/api/users/sync', (_req, _res, next) => {
    logger.info({ event: 'auth_sync', ip: _req.ip }, 'User auth sync attempt')
    next()
  })

  // ─── Routes ────────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/events', eventsRouter)
  app.use('/api/venues', venuesRouter)
  app.use('/api/geocode', geocodeRouter)
  app.use('/api/ai', aiRouter)
  app.use('/api/users', usersRouter)

  app.use(errorHandler)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found', message: 'Route not found', statusCode: 404 })
  })

  return app
}
