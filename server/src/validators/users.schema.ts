import { z } from 'zod'

// ─── Favorites ───────────────────────────────────────────────────────────────

export const addFavoriteSchema = z.object({
  id: z.string().min(1),
  source: z.enum(['ticketmaster', 'seatgeek', 'eventbrite', 'web']),
  sourceId: z.string().min(1),
  name: z.string().min(1).max(500),
  description: z.string().nullable().optional(),
  eventType: z.enum(['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film', 'other']),
  genre: z.string().nullable().optional(),
  subGenre: z.string().nullable().optional(),
  startDate: z.string(),
  startTime: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  dateStatus: z.enum(['confirmed', 'tbd', 'tba']),
  venue: z.object({
    name: z.string(),
    address: z.string().nullable(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  imageUrl: z.string().nullable().optional(),
  images: z.array(z.object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
  })).optional().default([]),
  priceRange: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    currency: z.string(),
  }).nullable().optional(),
  url: z.string().url(),
  popularity: z.number().nullable().optional(),
  isFavorited: z.boolean().optional(),
})

// ─── Preferences ─────────────────────────────────────────────────────────────

export const updatePreferencesSchema = z.object({
  defaultLatitude: z.number().min(-90).max(90).nullable().optional(),
  defaultLongitude: z.number().min(-180).max(180).nullable().optional(),
  defaultZipCode: z.string().max(10).nullable().optional(),
  defaultRadiusMiles: z.number().min(1).max(500).optional(),
  preferredEventTypes: z.array(
    z.enum(['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film', 'other'])
  ).optional(),
  notificationsEnabled: z.boolean().optional(),
})
