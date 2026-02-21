import { z } from 'zod'

export const aiSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(500).default(25),
})
