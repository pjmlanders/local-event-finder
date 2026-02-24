import type { IncomingMessage, ServerResponse } from 'http'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', url: req.url }))
}
