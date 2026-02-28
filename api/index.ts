/**
 * Vercel serverless function — wraps the Express app.
 *
 * We use lazy async initialization so that if env validation fails during
 * module import, the error is caught and surfaced as a 500 JSON response
 * instead of causing an unhandled FUNCTION_INVOCATION_FAILED crash.
 *
 * Static `import` statements cannot be try-caught; dynamic `await import()`
 * inside an async function can — which is why this pattern is necessary.
 */
import type { IncomingMessage, ServerResponse } from 'http'

type Handler = (req: IncomingMessage, res: ServerResponse) => void

let _handler: Handler | null = null
let _initError: string | null = null

// Kick off async initialization immediately so the first request doesn't
// pay the full cold-start cost.
const initPromise = (async () => {
  try {
    const { createApp } = await import('../server/src/app.js')
    _handler = createApp()
  } catch (err) {
    _initError = err instanceof Error
      ? `${err.constructor.name}: ${err.message}`
      : String(err)
    console.error('[api/index] Express app initialization failed:', _initError)
  }
})()

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise
  if (_handler) {
    return _handler(req, res)
  }
  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Server initialization failed', detail: _initError }))
}
