import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { searchAllSources } from './event-aggregator.service.js'
import type { UnifiedEvent } from 'shared'

const MODEL = 'claude-sonnet-4-20250514'

const SEARCH_TOOL: Anthropic.Tool = {
  name: 'search_events',
  description:
    'Search for live events (concerts, sports, theatre, comedy, family, film) near a location. ' +
    'Extract structured search parameters from the user\'s natural language query.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keyword: {
        type: 'string',
        description: 'Artist name, event name, or search keyword (e.g. "Taylor Swift", "jazz", "basketball")',
      },
      eventType: {
        type: 'string',
        enum: ['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film'],
        description: 'Category of event to search for',
      },
      startDate: {
        type: 'string',
        description: 'Start date in YYYY-MM-DD format. Use today\'s date if the user says "tonight" or "today".',
      },
      endDate: {
        type: 'string',
        description: 'End date in YYYY-MM-DD format. For "this weekend" use the upcoming Sunday.',
      },
      radius: {
        type: 'number',
        description: 'Search radius in miles (default 25). Only set if the user specifies a distance.',
      },
    },
  },
}

const EVENT_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  music: 'music',
  sports: 'sports',
  theatre: 'theatre',
  musical: 'theatre',
  comedy: 'comedy',
  family: 'family',
  film: 'film',
}

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
}

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  return (
    `You are a helpful event search assistant. Today is ${dayOfWeek}, ${today}. ` +
    `When the user asks about events, use the search_events tool to find them. ` +
    `Extract the most relevant search parameters from their query. ` +
    `If they mention "this weekend", calculate the dates for the upcoming Saturday and Sunday. ` +
    `If they mention "tonight" or "today", use today's date for both start and end. ` +
    `If they mention "next week", calculate the date range for the upcoming Monday through Sunday. ` +
    `Always use the search_events tool — do not try to answer event questions from memory.`
  )
}

export interface AiSearchResult {
  events: UnifiedEvent[]
  aiSummary: string
  extractedParams: Record<string, unknown>
  totalResults: number
  sources?: { ticketmaster: number; seatgeek: number; webSearch: number }
}

export async function aiSearchEvents(
  query: string,
  lat: number,
  lng: number,
  radius: number,
): Promise<AiSearchResult> {
  const client = getClient()

  // Step 1: Send user query to Claude with the search tool
  logger.info({ query, lat, lng, radius }, 'AI search request')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: query }],
    tools: [SEARCH_TOOL],
    tool_choice: { type: 'tool', name: 'search_events' },
  })

  // Step 2: Extract tool use from response
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolUseBlock) {
    logger.warn('Claude did not use the search tool')
    return {
      events: [],
      aiSummary: 'I wasn\'t able to parse your search query. Try being more specific.',
      extractedParams: {},
      totalResults: 0,
    }
  }

  const params = toolUseBlock.input as Record<string, unknown>
  logger.info({ extractedParams: params }, 'Claude extracted search params')

  // Step 3: Execute event search using the aggregator (Ticketmaster + SeatGeek)
  const classificationName =
    params.eventType === 'musical' ? 'theatre' : (params.eventType as string | undefined)
      ? EVENT_TYPE_TO_CLASSIFICATION[params.eventType as string]
      : undefined

  const startDateTime = params.startDate
    ? `${params.startDate}T00:00:00Z`
    : undefined
  const endDateTime = params.endDate
    ? `${params.endDate}T23:59:59Z`
    : undefined

  const searchRadius = (params.radius as number) ?? radius

  let searchResult = await searchAllSources({
    lat,
    lng,
    radius: searchRadius,
    keyword: params.keyword as string | undefined,
    eventType: params.eventType as string | undefined,
    classificationName,
    startDateTime,
    endDateTime,
    page: 0,
    size: 20,
    sort: 'relevance',
  })

  // Step 3b: If too few results, broaden the search progressively
  if (searchResult.events.length < 5) {
    // Try without date restriction first
    if (startDateTime || endDateTime) {
      logger.info('Few results — retrying without date restriction')
      const broader = await searchAllSources({
        lat,
        lng,
        radius: searchRadius,
        keyword: params.keyword as string | undefined,
        eventType: params.eventType as string | undefined,
        classificationName,
        page: 0,
        size: 20,
        sort: 'date',
      })
      if (broader.events.length > searchResult.events.length) {
        const existingIds = new Set(searchResult.events.map((e) => e.id))
        const additional = broader.events.filter((e) => !existingIds.has(e.id))
        searchResult = {
          events: [...searchResult.events, ...additional].slice(0, 20),
          total: searchResult.total + additional.length,
          sources: {
            ticketmaster: searchResult.sources.ticketmaster + broader.sources.ticketmaster,
            seatgeek: searchResult.sources.seatgeek + broader.sources.seatgeek,
            duplicatesRemoved: searchResult.sources.duplicatesRemoved + broader.sources.duplicatesRemoved,
          },
        }
      }
    }

    // Still too few? Try without keyword restriction
    if (searchResult.events.length < 5 && params.keyword) {
      logger.info('Still few results — retrying without keyword')
      const evenBroader = await searchAllSources({
        lat,
        lng,
        radius: searchRadius,
        eventType: params.eventType as string | undefined,
        classificationName,
        startDateTime,
        endDateTime,
        page: 0,
        size: 20,
        sort: 'date',
      })
      if (evenBroader.events.length > 0) {
        const existingIds = new Set(searchResult.events.map((e) => e.id))
        const additional = evenBroader.events.filter((e) => !existingIds.has(e.id))
        searchResult = {
          events: [...searchResult.events, ...additional].slice(0, 20),
          total: searchResult.total + additional.length,
          sources: {
            ticketmaster: searchResult.sources.ticketmaster + evenBroader.sources.ticketmaster,
            seatgeek: searchResult.sources.seatgeek + evenBroader.sources.seatgeek,
            duplicatesRemoved: searchResult.sources.duplicatesRemoved + evenBroader.sources.duplicatesRemoved,
          },
        }
      }
    }
  }

  // Step 4: Use Claude web search for events not found in structured APIs
  let webSearchEvents: UnifiedEvent[] = []
  try {
    webSearchEvents = await searchWebForEvents(client, query, lat, lng, searchRadius, searchResult.events)
    if (webSearchEvents.length > 0) {
      logger.info({ webResults: webSearchEvents.length }, 'Found additional events via web search')
      // Add web search events that aren't duplicates
      const existingIds = new Set(searchResult.events.map(e => e.id))
      const existingNames = searchResult.events.map(e => e.name.toLowerCase())
      const novel = webSearchEvents.filter(e =>
        !existingIds.has(e.id) &&
        !existingNames.some(name => name.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(name))
      )
      searchResult.events = [...searchResult.events, ...novel].slice(0, 25)
      searchResult.total += novel.length
    }
  } catch (err) {
    logger.warn({ error: err instanceof Error ? err.message : err }, 'Web search failed, continuing with API results')
  }

  // Step 5: Send results back to Claude to generate a summary
  const eventSummaries = searchResult.events.slice(0, 12).map((e) => ({
    name: e.name,
    venue: e.venue.name,
    city: e.venue.city,
    date: e.startDate,
    time: e.startTime,
    type: e.eventType,
    genre: e.genre,
    price: e.priceRange,
    source: e.source,
  }))

  const sourceBreakdown = `Sources: ${searchResult.sources.ticketmaster} from Ticketmaster, ${searchResult.sources.seatgeek} from SeatGeek, ${webSearchEvents.length} from web search. ${searchResult.sources.duplicatesRemoved} duplicates removed.`

  const summaryResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: 'You are a concise event assistant. Summarize the search results in 2-3 friendly sentences. Mention the total count, highlight a few interesting options, and note the date range if relevant. If results come from multiple sources, briefly mention that for credibility.',
    messages: [
      {
        role: 'user',
        content: `The user searched for "${query}" near lat ${lat}, lng ${lng} within ${searchRadius} miles. We found ${searchResult.total} events. ${sourceBreakdown}\n\nTop results:\n${JSON.stringify(eventSummaries, null, 2)}`,
      },
    ],
  })

  const textBlock = summaryResponse.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  )
  const aiSummary = textBlock?.text ?? `Found ${searchResult.total} events matching your search.`

  return {
    events: searchResult.events,
    aiSummary,
    extractedParams: params,
    totalResults: searchResult.total,
    sources: {
      ticketmaster: searchResult.sources.ticketmaster,
      seatgeek: searchResult.sources.seatgeek,
      webSearch: webSearchEvents.length,
    },
  }
}

/**
 * Use Claude's web search to find events from sources beyond Ticketmaster/SeatGeek.
 * Returns UnifiedEvent objects parsed from web results.
 */
async function searchWebForEvents(
  client: Anthropic,
  query: string,
  lat: number,
  lng: number,
  radius: number,
  existingEvents: UnifiedEvent[],
): Promise<UnifiedEvent[]> {
  const today = new Date().toISOString().split('T')[0]

  // Determine rough location name for the web search
  const sampleCity = existingEvents[0]?.venue.city ?? 'the area'
  const sampleState = existingEvents[0]?.venue.state ?? ''
  const locationLabel = sampleState ? `${sampleCity}, ${sampleState}` : sampleCity

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
              name: { type: 'string', description: 'Event name' },
              venue: { type: 'string', description: 'Venue name' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State abbreviation' },
              date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
              time: { type: 'string', description: 'Time in HH:MM:SS format or null' },
              eventType: {
                type: 'string',
                enum: ['music', 'sports', 'theatre', 'musical', 'comedy', 'family', 'film', 'other'],
              },
              url: { type: 'string', description: 'URL to buy tickets or event page' },
              description: { type: 'string', description: 'Brief description' },
              priceMin: { type: 'number', description: 'Minimum price or null' },
              priceMax: { type: 'number', description: 'Maximum price or null' },
            },
            required: ['name', 'venue', 'city', 'state', 'date', 'eventType', 'url'],
          },
        },
      },
      required: ['events'],
    },
  }

  const existingEventNames = existingEvents.slice(0, 10).map(e => e.name).join(', ')

  const webResponse = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are an event research assistant. Today is ${today}. Search the web for live events matching the user's query. Focus on finding events from venue websites, Eventbrite, local event calendars, and other sources NOT typically found on Ticketmaster or SeatGeek. Extract structured event data using the extract_events tool. Only include events with confirmed dates and venues. Do not include events that are clearly the same as the ones already found.`,
    messages: [
      {
        role: 'user',
        content: `Search for: "${query}" near ${locationLabel} (within ${radius} miles). Today is ${today}.\n\nWe already have these events from Ticketmaster/SeatGeek: ${existingEventNames || 'none'}\n\nPlease search the web to find additional events NOT in that list, particularly from venue websites, Eventbrite, local event listings, etc. Extract any events you find using the extract_events tool.`,
      },
    ],
    tools: [
      WEB_EXTRACT_TOOL,
      { type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as unknown as Anthropic.Tool,
    ],
  })

  // Find the extract_events tool call in the response
  const extractBlock = webResponse.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === 'extract_events',
  )

  if (!extractBlock) {
    logger.debug('Claude web search did not return structured events')
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

  // Convert to UnifiedEvent format
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
        latitude: lat, // Approximate — web events don't always have exact coords
        longitude: lng,
      },
      imageUrl: null,
      images: [],
      priceRange: e.priceMin != null ? { min: e.priceMin, max: e.priceMax ?? null, currency: 'USD' } : null,
      url: e.url,
      popularity: null,
    }))
}
