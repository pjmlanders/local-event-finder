/**
 * Vercel serverless function — wraps the Express app.
 *
 * We use lazy async initialization so that if the Express app fails to start
 * (e.g. bad env var causing process.exit), we can surface the error in the
 * response rather than silently returning FUNCTION_INVOCATION_FAILED.
 *
 * Note: process.exit() CANNOT be caught with try/catch. If env validation
 * calls process.exit(1), we intercept it here before the app loads.
 */
import type { IncomingMessage, ServerResponse } from 'http'

// Intercept process.exit so Zod env validation failures return a useful error
// instead of killing the serverless function with no log output.
const _originalExit = process.exit.bind(process)
let exitCalled = false
let exitCode: number | undefined
// @ts-ignore – override for diagnostics only
process.exit = (code?: number) => {
  exitCalled = true
  exitCode = code
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void

let _handler: Handler | null = null
let _initError: string | null = null
let _initialized = false

async function init() {
  if (_initialized) return
  _initialized = true
  try {
    const { createApp } = await import('../server/src/app.js')
    if (exitCalled) {
      _initError = `process.exit(${exitCode}) was called during app initialization. Check env vars.`
      return
    }
    _handler = createApp()
  } catch (err) {
    _initError = err instanceof Error
      ? `${err.constructor.name}: ${err.message}\n${err.stack}`
      : String(err)
  }
}

// Kick off initialization immediately (not per-request)
const initPromise = init()

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise
  if (_handler) {
    return _handler(req, res)
  }
  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    error: 'Server initialization failed',
    detail: _initError,
    nodeEnv: process.env.NODE_ENV,
    hasTM: !!process.env.TICKETMASTER_API_KEY,
  }))
}
