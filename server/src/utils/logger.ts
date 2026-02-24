import pino from 'pino'

// pino-pretty uses worker threads which aren't supported in serverless (Vercel).
// Use pretty transport only in local development; fall back to plain JSON in production.
export const logger = pino(
  process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      },
)
