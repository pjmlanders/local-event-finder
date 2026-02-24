/**
 * Vercel serverless function — wraps the Express app.
 * Vercel routes /api/** here via vercel.json rewrites.
 * The Express app handles all internal routing at /api/events, /api/ai, etc.
 */
import type { IncomingMessage, ServerResponse } from 'http'

let handler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null
let initError: string | null = null

async function getHandler() {
  if (handler) return handler
  if (initError) return null
  try {
    const { createApp } = await import('../server/src/app.js')
    handler = createApp()
    return handler
  } catch (err) {
    initError = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
    return null
  }
}

export default async function api(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler()
  if (!h) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Server init failed', detail: initError }))
    return
  }
  h(req, res)
}
