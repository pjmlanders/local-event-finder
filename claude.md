# Local Event Finder - Build Log

## Project Overview
- **Project Name:** Local Event Finder
- **Start Date:** February 18, 2026
- **Description:** A React-based PWA that aggregates live events from local venues, determined by GPS or ZIP code within a set radius. Features AI-powered natural language search (Claude), interactive map view, event filtering, and user accounts with saved preferences.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite 7, Tailwind CSS v4 |
| Backend | Node.js + Express 5 + TypeScript (tsx for dev) |
| Database | PostgreSQL (Supabase/Neon - not yet connected) |
| Auth | Firebase Authentication (not yet implemented) |
| Event APIs | Ticketmaster Discovery API (live), SeatGeek (Phase 3) |
| AI | Claude API via @anthropic-ai/sdk (Phase 6) |
| Maps | React-Leaflet with OpenStreetMap (Phase 4) |
| State | TanStack Query (server state) + React Context (UI state) |
| PWA | vite-plugin-pwa / Workbox (Phase 7) |

## Project Structure
```
Local Event Finder/
├── package.json              # npm workspaces monorepo root
├── tsconfig.base.json
├── .env                      # API keys (gitignored)
├── .gitignore
├── client/                   # Vite + React PWA (port 5180)
│   ├── src/
│   │   ├── api/              # Axios HTTP client + endpoint functions
│   │   ├── components/
│   │   │   ├── events/       # EventCard, EventList, DayShowToggle
│   │   │   ├── search/       # SearchBar, LocationPicker, RadiusSlider, EventTypeChips, DateFilter
│   │   │   └── ui/           # Pagination
│   │   ├── context/          # LocationContext (GPS/ZIP + radius state)
│   │   ├── hooks/            # useEvents (TanStack Query)
│   │   ├── lib/              # queryClient, constants
│   │   ├── pages/            # HomePage, SearchResultsPage, DiagnosticsPage
│   │   └── utils/            # formatDate, formatPrice, groupEvents
│   └── vite.config.ts        # Tailwind plugin + API proxy to :3002
├── server/                   # Express API (port 3002)
│   └── src/
│       ├── config/           # env.ts (Zod-validated)
│       ├── controllers/      # events.controller.ts
│       ├── middleware/        # errorHandler, validateRequest (res.locals pattern)
│       ├── routes/           # events.routes.ts
│       ├── services/         # ticketmaster.service.ts
│       ├── types/            # ticketmaster.types.ts
│       ├── utils/            # mapTicketmaster.ts, logger.ts
│       └── validators/       # events.schema.ts (Zod)
└── shared/                   # Shared TypeScript types
    └── src/types/            # UnifiedEvent, SearchParams, UserProfile, API types
```

## Port Configuration
- **Client (Vite):** localhost:5180
- **Server (Express):** localhost:3002
- Ports 5173, 5174, 3001 are used by other projects on this machine

## Environment Variables (.env at project root)
```
PORT=3002
TICKETMASTER_API_KEY=<your key>
NODE_ENV=development
```

## Implementation Phases

### Phase 1: Foundation - COMPLETE
- Monorepo scaffolding with npm workspaces (client, server, shared)
- Vite + React + TypeScript + Tailwind CSS client
- Express 5 + TypeScript server with tsx dev runner
- Shared UnifiedEvent type model
- Ticketmaster Discovery API integration with response mapper
- GET /api/events endpoint with Zod validation
- Basic event list display
- TanStack Query for API caching (5-min stale time)

### Phase 2: Location + Search UI - COMPLETE
- LocationContext with GPS detection, ZIP code geocoding (Nominatim), radius, localStorage persistence
- LocationPicker component (GPS button + ZIP input + status indicator)
- RadiusSlider (5/10/25/50/100 mi buttons)
- EventTypeChips (pill-style category filters with emoji icons)
- SearchBar with 400ms debounce
- DateFilter with quick-select buttons (Today, This Weekend, 7 Days, 30 Days) + manual date pickers
- DayShowToggle - "By Day" groups events under date headers, "By Show" groups same-name events at same venue into single card with date range
- Event grouping logic: same artist + same venue = one card with "X shows" badge and full date range
- EventList with day-grouped and flat modes + empty states
- Pagination with smart ellipsis
- Improved EventCard: responsive (top image mobile, side image desktop), genre info, venue/date icons
- SearchResultsPage with all filters synced to URL params (?q=&type=&startDate=&endDate=&page=)
- HomePage with hero section, category browsing, 6-event preview
- Desktop header nav + mobile bottom tab bar
- DiagnosticsPage at /diagnostics for testing service connectivity

### Phase 3: SeatGeek + Event Detail - PENDING
- SeatGeek API service + mapper
- EventAggregatorService (merge + deduplicate cross-source)
- Event detail page with full info, booking link, embedded venue map

### Phase 4: Map View - PENDING
- React-Leaflet integration
- Clustered venue markers by event type
- Event popups on marker click
- Full-screen MapPage with event list panel

### Phase 5: Auth + User Data - PENDING
- Firebase Auth (email/password + Google OAuth)
- PostgreSQL migrations (users, preferences, favorites, search_history)
- User sync, profile, preferences, favorites CRUD
- FavoriteButton with optimistic updates
- ProfilePage, SettingsPage, FavoritesPage

### Phase 6: Claude AI - PENDING
- @anthropic-ai/sdk integration
- Tool-use-based natural language search parsing
- Recommendation engine using user preferences + history
- AiSearchPage UI
- Rate limiting + caching + graceful fallback

### Phase 7: PWA + Polish + Deploy - PENDING
- vite-plugin-pwa with Workbox caching strategies
- Install prompt, offline indicator, dark mode
- Skeleton loading states, error boundaries
- Responsive audit, Lighthouse optimization
- Deploy server to Railway/Render, client to Vercel/Netlify

## Key Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Express 5 | Latest version, but req.query is read-only — use res.locals.validatedQuery pattern |
| ESM + dynamic imports in server entry | dotenv.config() must run before env.ts loads; static imports are hoisted in ESM |
| Vite proxy for dev | Client calls /api/* which Vite proxies to Express, avoiding CORS in development |
| Event grouping in "By Show" view | Same-name events at same venue are merged into single card with date range + show count |
| TanStack Query (not Redux) | All data is server-state; TQ handles caching, refetching, pagination natively |
| Nominatim for geocoding | Free, no API key needed, sufficient for ZIP-to-coordinates |

## Known Issues / Notes
- Server must be started from a terminal (not background process) to persist
- Ticketmaster free tier: 5,000 calls/day, 5 req/sec
- SeatGeek Platform API requires requesting access (apply early)

---

*Last updated: February 18, 2026*
