import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  TICKETMASTER_API_KEY: z.string().min(1, 'TICKETMASTER_API_KEY is required'),
  SEATGEEK_CLIENT_ID: z.string().optional(),
  STUBHUB_CLIENT_ID: z.string().optional(),
  STUBHUB_CLIENT_SECRET: z.string().optional(),
  EVENTBRITE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NODE_ENV: z.string().trim().pipe(z.enum(['development', 'production', 'test'])).default('development'),
  CLIENT_URL: z.string().url().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  /* Affiliate IDs for click-through revenue. Get them by joining each program. */
  TICKETMASTER_AFFILIATE_ID: z.string().optional(),
  SEATGEEK_AFFILIATE_ID: z.string().optional(),
  STUBHUB_AFFILIATE_ID: z.string().optional(),
  EVENTBRITE_AFFILIATE_ID: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const errors = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  // Throw instead of process.exit so serverless runtimes (Vercel) can catch and report the error.
  throw new Error(`Invalid environment variables:\n${errors}`)
}

export const env = parsed.data
