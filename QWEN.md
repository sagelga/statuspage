# ByteSide.one Status Page — QWEN Context

## Project Overview

Next.js 16 status page for **ByteSide.one** and **sagelga.com**. Displays real-time service health, 30-day uptime bars, and per-minute incident mosaics. Data is read from Cloudflare KV (written by the separate **statuspage-pulse** worker), not fetched live from external endpoints on each page view.

### Key Features

- Dual-brand toggle (ByteSide / sagelga) with URL `?brand=` support
- Three-phase client load for fast badges before full history
- 30-day daily bars + 1440-cell minute mosaic per service/day
- Thai UI, light/dark theme, cookie consent, auto-refresh timer
- Edge API routes (`runtime = 'edge'`) backed by KV

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.2 (App Router) |
| Runtime | Cloudflare Pages (Edge) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS 4 + component CSS |
| Storage | Cloudflare KV (`STATUS_HISTORY`) |
| Testing | Node `node:test` (tsx) + Playwright |

## Project Structure

```
statuspage/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── status/route.ts           # GET /api/status (edge, KV)
│   │   │   └── minutes/[serviceId]/[date]/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Client shell + load sequence
│   ├── components/
│   │   ├── layout/                       # Navbar.tsx, Footer.tsx (active)
│   │   ├── ServiceList/                  # Bars, mosaic, refresh timer hook-in
│   │   ├── Hero/
│   │   ├── IncidentHistory/
│   │   ├── ApiSection/
│   │   ├── BrandToggle/
│   │   ├── RefreshTimer/
│   │   ├── cookies/
│   │   ├── theme/
│   │   ├── ui/
│   │   └── Icons.ts
│   ├── lib/                              # Shared logic (see Notes)
│   ├── config.ts                         # SERVICES_BY_BRAND (display only)
│   ├── types.ts
│   ├── hooks/useTheme.tsx
│   └── utils/cookies.ts
├── tests/
│   ├── unit/                             # brand-filter, status-data, load-status-sequence, etc.
│   └── e2e/                              # Playwright (status-page, fast-load-evidence, …)
├── public/static/img/                    # Logos and assets
├── wrangler.toml
└── package.json
```

Removed legacy paths (do not reference): `components/Navbar/`, `components/Footer/`, `components/ThemeToggle/`, `ServiceChecker.ts`, `HistoryManager.ts`, `App.css`.

## Building and Running

```bash
npm run dev       # http://localhost:3000
npm run build
npm run start
npm test          # unit + playwright
npm run lint
npm run pages:build   # Cloudflare adapter
npm run deploy
```

## Configuration

### `src/config.ts`

- `SERVICES_BY_BRAND` — UI display metadata per brand (names, icons, endpoint URLs for tooltips)
- `BRANDS` — Brand labels and Thai descriptions
- `TIMEOUT_MS`, `DEGRADED_THRESHOLD_MS` — Used by pulse worker thresholds (documented here for reference)

**Important:** Service health is **not** checked in this repo at runtime. The pulse worker writes results to KV; this app reads KV via `/api/status`.

### Environment

KV binding `STATUS_HISTORY` is configured in `wrangler.toml` for Cloudflare Pages.

## Type Definitions (`src/types.ts`)

```typescript
ServiceStatus = 'operational' | 'degraded' | 'down'

StatusResponse {
  status, checkedAt, services,
  history: Record<serviceId, (ServiceStatus | 'nodata')[]>,  // 30 days
  dailyUptime?, dailyFuncUptime?   // per-day % arrays
}

CurrentStatusResponse  // fast path: services only, history may be {}
```

## Testing

| Suite | Command | Coverage |
|-------|---------|----------|
| Unit | `node --import tsx --test tests/unit/*.test.ts` | `lib/` merge, brand filter, load sequence, API URL |
| E2E | `npx playwright test` | Page load, brand switch, mosaic hover, loading states |

Run both via `npm test`.

## API Endpoints

### `GET /api/status`

Query: `tzOffset`, `brand`, `currentOnly`. Reads `config:services`, `m:{id}`, `daily:{id}`, `ping:{id}` from KV. Uses `decodeStatus` from `lib/decode-status.ts` and `getLast30IsoDates` from `lib/date-range.ts` for tz-aware history.

### `GET /api/minutes/[serviceId]/[date]`

Returns 1440-element array. Maps KV epoch keys to local minute indices using `tzOffset`.

## Notes

### `lib/` deduplication

| File | Exports |
|------|---------|
| `decode-status.ts` | `decodeStatus(code)`, `STATUS_PRIORITY` for daily tz overlap |
| `date-range.ts` | `getTimezoneOffsetMinutes`, `getLast30IsoDates`, `getLast30DateLabels`, `parseTimezoneOffsetParam` |
| `load-status-sequence.ts` | `loadStatusSequence` — currentOnly → brand-full → all-full |
| `status-data.ts` | `mergeStatusData` — preserves history when fast payload omits it |
| `status-api-url.ts` | `buildStatusApiUrl` |
| `brand-filter.ts` | `filterServiceDefinitions`, `isValidBrandParam` |
| `brand-status.ts` | `brandHasHistory`, `countLoadedForBrand` |

### Three-phase load sequence

1. **currentOnly** — Badges + response times appear quickly (`history: {}`).
2. **brand-full** — 30-day history for active brand.
3. **all-full** — Cross-brand cache for instant tab switches.

Implemented in `load-status-sequence.ts`; `page.tsx` calls it on mount and re-fetches on brand change (current before full).

### Timezone handling

- Client sends `tzOffset` (minutes east of UTC) on every API call.
- `getLast30IsoDates` builds local calendar days from that offset.
- Non-UTC daily history merges two UTC date keys and picks worst status via `STATUS_PRIORITY`.

### Theme & cookies

- Theme: `localStorage` key `theme-preference` via `useTheme` hook.
- Cookies: `cookie-preferences` key; consent banner in `components/cookies/`.

### Fonts

IBM Plex Sans Thai (UI), JetBrains Mono (metrics) — loaded in `layout.tsx`.