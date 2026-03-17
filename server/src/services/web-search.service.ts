/**
 * Claude-powered web search for events from sources beyond structured APIs.
 * Finds events from venue websites, Eventbrite listings, local calendars, etc.
 *
 * Extracted into its own module so both the AI service and the regular aggregator
 * can use it without creating a circular dependency.
 */
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { withAffiliateParams } from '../utils/affiliateUrls.js'
import type { UnifiedEvent } from 'shared'

const MODEL = 'claude-sonnet-4-6'

const WEB_EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_events',
  description: 'Extract structured event information from web search results.',
  input_schema: {
    type: 'object' as const,
    properties: {
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name:        { type: 'string', description: 'Event name' },
            venue:       { type: 'string', description: 'Venue name' },
            city:        { type: 'string', description: 'City' },
            state:       { type: 'string', description: 'State abbreviation' },
            date:        { type: 'string', description: 'Date in YYYY-MM-DD format' },
            time:        { type: 'string', description: 'Time in HH:MM:SS format or null' },
            eventType: {
              type: 'string',
              enum: ['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film', 'other'],
            },
            url:         { type: 'string', description: 'URL to buy tickets or event page' },
            description: { type: 'string', description: 'Brief description' },
            priceMin:    { type: 'number', description: 'Minimum ticket price or null' },
            priceMax:    { type: 'number', description: 'Maximum ticket price or null' },
          },
          required: ['name', 'venue', 'city', 'state', 'date', 'eventType', 'url'],
        },
      },
    },
    required: ['events'],
  },
}

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

/**
 * Use Claude's web search to surface events from small venues, Eventbrite pages,
 * local calendars, and venue websites that the structured APIs miss.
 *
 * @param query        User's original search query or a synthesized one
 * @param lat          Center latitude
 * @param lng          Center longitude
 * @param radius       Search radius in miles
 * @param existingEvents  Events already found — used to avoid duplicates
 */
export async function searchWebForEvents(
  query: string,
  lat: number,
  lng: number,
  radius: number,
  existingEvents: UnifiedEvent[],
): Promise<UnifiedEvent[]> {
  if (!env.ANTHROPIC_API_KEY) return []

  const client = getClient()
  const today = new Date().toISOString().split('T')[0]

  const sampleCity  = existingEvents[0]?.venue.city
  const sampleState = existingEvents[0]?.venue.state ?? ''
  const locationLabel = sampleCity
    ? (sampleState ? `${sampleCity}, ${sampleState}` : sampleCity)
    : `coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`

  const existingNames = existingEvents.slice(0, 15).map(e => e.name).join(', ')

  const webResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: (
      `You are an event research assistant. Today is ${today}. ` +
      `Search the web for live events matching the user's query. ` +
      `Search broadly across: StubHub, TicketsOnSale, Tickets-Center, SeatGeek, venue websites, ` +
      `Eventbrite pages, FreshTix, Brown Paper Tickets, Bandsintown, Songkick, local event calendars, ` +
      `Do512, Do202, and local media/arts listings. ` +
      `Extract structured event data using the extract_events tool. ` +
      `Only include events with confirmed dates and venues. ` +
      `Do not include events that are clearly duplicates of the ones already found.`
    ),
    messages: [
      {
        role: 'user',
        content: (
          `Search for: "${query}" near ${locationLabel} (within ${radius} miles). Today is ${today}.\n\n` +
          `We already have these events from Ticketmaster/SeatGeek/Eventbrite: ${existingNames || 'none'}\n\n` +
          `Find additional events NOT in that list. Check StubHub, TicketsOnSale.com, venue websites, ` +
          `and local arts/entertainment listings. Include events from small/independent venues ` +
          `and community venues that may use FreshTix, Brown Paper Tickets, or similar platforms. ` +
          `Use the extract_events tool to return them.`
        ),
      },
    ],
    tools: [
      WEB_EXTRACT_TOOL,
      { type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as unknown as Anthropic.Tool,
    ],
  })

  const extractBlock = webResponse.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'extract_events',
  )

  if (!extractBlock) {
    logger.debug('Claude web search returned no structured events')
    return []
  }

  const extracted = extractBlock.input as {
    events: Array<{
      name: string
      venue: string
      city: string
      state: string
      date: string
      time?: string
      eventType: string
      url: string
      description?: string
      priceMin?: number
      priceMax?: number
    }>
  }

  return extracted.events
    .filter(e => e.name && e.venue && e.date && e.url)
    .map((e, i) => ({
      id: `web_${Date.now()}_${i}`,
      source: 'web' as const,
      sourceId: `web_${i}`,
      name: e.name,
      description: e.description ?? null,
      eventType: (e.eventType as UnifiedEvent['eventType']) ?? 'other',
      genre: null,
      subGenre: null,
      startDate: e.date,
      startTime: e.time ?? null,
      endDate: null,
      timezone: null,
      dateStatus: 'confirmed' as const,
      venue: {
        name: e.venue,
        address: null,
        city: e.city,
        state: e.state,
        postalCode: null,
        latitude: lat,   // approximate — web events don't always have exact coords
        longitude: lng,
      },
      imageUrl: null,
      images: [],
      priceRange: e.priceMin != null
        ? { min: e.priceMin, max: e.priceMax ?? null, currency: 'USD' }
        : null,
      url: withAffiliateParams(e.url, 'web', {
        ticketmaster: env.TICKETMASTER_AFFILIATE_ID,
        seatgeek: env.SEATGEEK_AFFILIATE_ID,
      }),
      popularity: null,
    }))
}
