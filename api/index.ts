/**
 * Vercel serverless function — wraps the Express app.
 * Vercel routes /api/** here via vercel.json rewrites.
 * The Express app handles all internal routing at /api/events, /api/ai, etc.
 */
import { createApp } from '../server/src/app.js'

const app = createApp()

export default app
