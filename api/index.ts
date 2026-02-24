import type { IncomingMessage, ServerResponse } from 'http'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    status: 'ok',
    url: req.url,
    hasTM: !!process.env.TICKETMASTER_API_KEY,
    hasAnth: !!process.env.ANTHROPIC_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  }))
}
