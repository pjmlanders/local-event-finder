import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  TICKETMASTER_API_KEY: z.string().min(1, 'TICKETMASTER_API_KEY is required'),
  SEATGEEK_CLIENT_ID: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
