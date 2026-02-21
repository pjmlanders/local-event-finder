import { z } from 'zod'

export const geocodeSchema = z.object({
  zip: z
    .string()
    .regex(/^\d{5}$/, 'Must be a 5-digit US ZIP code'),
})
