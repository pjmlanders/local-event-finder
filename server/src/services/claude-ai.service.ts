import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { searchAllSources } from './event-aggregator.service.js'
import { searchWebForEvents } from './web-search.service.js'
import type { UnifiedEvent } from 'shared'

const MODEL = 'claude-sonnet-4-6'

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
            eventbrite: searchResult.sources.eventbrite + broader.sources.eventbrite,
            stubhub: searchResult.sources.stubhub + broader.sources.stubhub,
            webSearch: searchResult.sources.webSearch + broader.sources.webSearch,
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
            eventbrite: searchResult.sources.eventbrite + evenBroader.sources.eventbrite,
            stubhub: searchResult.sources.stubhub + evenBroader.sources.stubhub,
            webSearch: searchResult.sources.webSearch + evenBroader.sources.webSearch,
            duplicatesRemoved: searchResult.sources.duplicatesRemoved + evenBroader.sources.duplicatesRemoved,
          },
        }
      }
    }
  }

  // Step 4: Use Claude web search for events not found in structured APIs
  let webSearchEvents: UnifiedEvent[] = []
  try {
    webSearchEvents = await searchWebForEvents(query, lat, lng, searchRadius, searchResult.events)
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

  const sourceBreakdown = `Sources: ${searchResult.sources.ticketmaster} from Ticketmaster, ${searchResult.sources.seatgeek} from SeatGeek, ${searchResult.sources.eventbrite} from Eventbrite, ${webSearchEvents.length} from web search. ${searchResult.sources.duplicatesRemoved} duplicates removed.`

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

// searchWebForEvents is now in web-search.service.ts
