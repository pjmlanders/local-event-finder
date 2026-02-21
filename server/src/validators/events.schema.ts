import { z } from 'zod'

export const eventSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(500).default(25),
  keyword: z.string().optional(),
  eventType: z.enum(['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film', 'other']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(0).default(0),
  size: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['date', 'relevance', 'name']).default('date'),
})

export type EventSearchQuery = z.infer<typeof eventSearchSchema>
