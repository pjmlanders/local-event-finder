import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env from project root BEFORE any other imports
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Dynamic imports ensure env vars are available when these modules initialize
const { createApp } = await import('./app.js')
const { env } = await import('./config/env.js')
const { logger } = await import('./utils/logger.js')

const app = createApp()

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`)
})
