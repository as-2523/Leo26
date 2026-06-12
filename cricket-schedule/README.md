# 🏏 India Cricket Schedule Dashboard

A production-ready Next.js app that aggregates upcoming fixtures for five Indian
cricket teams into a single dashboard, covering a **rolling 6-month window**
(configurable via `WINDOW_MONTHS` in `src/lib/window.ts`):

- India Men
- India A Men
- India Under-19 Men
- India Women
- India A Women

## Features

- **Calendar view** — monthly and weekly, with color-coded team chips and a
  click-to-expand day detail panel
- **Table view** — date, time (IST), team, opponent, format, series, venue
- **Map view** — monthly venue map (Leaflet + OpenStreetMap, no API key);
  city coordinates are bundled in `src/lib/geo.ts`
- **Filters** — by team and by normalized match format
  (Test, ODI, T20, First-class, List A, Youth)
- **Auto refresh** — client refetches every 30 minutes; manual Refresh button
  with server-side rate-limit protection
- All times displayed in **IST (Asia/Kolkata)**

## Data sources & fallback chain

| Priority | Source | Type | Notes |
|---|---|---|---|
| 1 | ESPNcricinfo public JSON API (`hs-consumer-api.espncricinfo.com`) | API | Same JSON the espncricinfo.com site uses. Preferred over HTML scraping — more stable and avoids parsing pages disallowed for crawling. Unofficial, so parsing is fully defensive. |
| 2 | [CricAPI / cricketdata.org](https://cricketdata.org) | Documented API | Optional; enabled by setting `CRICAPI_KEY` (free tier available). |
| 3 | Bundled sample fixtures | Static | Last resort when no live source responds. The UI shows a prominent **"Sample data"** banner so illustrative fixtures are never mistaken for a real schedule. |

How aggregation works (`src/lib/aggregate.ts`):

1. Every configured live source is queried (per-team failures are isolated).
2. Raw matches are **normalized** into one fixture shape; team names are
   matched with exact-alias matching so "India" never swallows "India A" or
   "India Women"; format labels are normalized into filter buckets.
3. Fixtures are **deduplicated** across sources (same team + opponent + UTC
   date + format), with higher-priority sources winning.
4. Results are **clamped to the rolling 6-month window** and sorted by start time.
5. Only if *zero* live fixtures were obtained does the app fall back to sample
   data, and `meta.usedFallback` is set so the UI can show the banner.

### Responsible data access

- **APIs over scraping**: only JSON endpoints are used — no HTML scraping, so
  no crawling of pages restricted by robots.txt.
- **Rate limits**: responses are cached server-side for 30 minutes; even a
  forced refresh will not contact upstream more than once per minute.
  Concurrent requests share a single in-flight upstream call.
- **Identification**: outbound requests send a descriptive User-Agent.
- ESPNcricinfo team ids live in `src/lib/teams.ts` (`espnTeamId`); verify them
  against the team page URLs (e.g. `espncricinfo.com/team/india-6`) if a team
  returns no fixtures.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: add CRICAPI_KEY
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

Deploys out of the box on Vercel or any Node 20+ host (set the project root to
`cricket-schedule/`).

## Project structure

```
src/
  app/
    page.tsx                  # dashboard page
    api/fixtures/route.ts     # GET /api/fixtures (+ ?force=1)
  components/                 # Dashboard, CalendarView, FixtureTable, Filters…
  lib/
    aggregate.ts              # source chain, cache, rate limiting
    teams.ts                  # tracked-team registry (aliases, colors, ids)
    formats.ts                # format normalization
    normalize.ts              # dedupe + rolling window clamp
    window.ts                 # schedule window helpers
    display.ts                # IST formatting
    sources/                  # espn.ts, cricapi.ts, seed.ts, http.ts
```

## Quality

```bash
npm run lint   # ESLint (next config)
npm test       # vitest — normalization, dedupe, window, team & format matching
```

CI (GitHub Actions) runs lint, tests and a production build on every push/PR
touching this app.

## Extending

- **New source**: add an adapter in `src/lib/sources/` returning `Fixture[]`,
  register it in `aggregate.ts` with a priority in `normalize.ts`.
- **New team**: add an entry to `TEAMS` in `src/lib/teams.ts` (aliases, color,
  ESPN team id) — filters, legend and calendar pick it up automatically.
