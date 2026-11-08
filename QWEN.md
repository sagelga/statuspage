# ByteSide.one Status Page — QWEN Context

## Project Overview

Next.js 16.4.5 status page for **ByteSide.one** and **sagelga.com**. Displays real-time service health, 30-day uptime bars, and per-minute incident mosaics. Data is read from Cloudflare KV (written by the separate **statuspage-pulse** worker), not fetched live from external endpoints on each page view.

### Key Features

- Multi-brand toggle (ByteSide / sagelga / ไทยพัฒน์เมทัล) with URL `?brand=` support
- Three-phase client load for fast badges before full history
- 30-day daily bars + 1440-cell minute mosaic per service/day
- Thai UI, light/dark theme, cookie consent, auto-refresh timer
- Cloudflare Workers API routes (Node.js runtime via OpenNext) backed by KV

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.4.5 (App Router) |
| Runtime | Cloudflare Workers (Node.js) via `@opennextjs/cloudflare` 1.20.x |
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
│   │   │   ├── status/route.ts           # GET /api/status (thin handler)
│   │   │   └── minutes/[serviceId]/[date]/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Server wrapper: ?brand= via searchParams
│   ├── components/
│   │   ├── StatusPageClient.tsx           # Client shell; state in useStatusData
│   │   ├── layout/                       # Navbar, Footer, StatusNavbar
│   │   ├── ServiceList/                  # ServiceList, ServiceRow, UptimeBars, MinuteMosaic, ServiceBadge, types
│   │   ├── Hero/
│   │   ├── IncidentHistory/
│   │   ├── ApiSection/
│   │   ├── BrandToggle/
│   │   ├── RefreshTimer/
│   │   ├── cookies/
│   │   ├── theme/
│   │   ├── ui/
│   │   └── Icons.tsx
│   ├── hooks/
│   │   ├── useStatusData.ts              # Three-phase load, brand switch, refresh
│   │   └── useTheme.tsx
│   ├── lib/
│   │   ├── status-policy.ts              # Aggregation + uptime thresholds
│   │   ├── status-response.ts            # Response builders (injected StatusStore)
│   │   ├── status-kv.ts                  # getCloudflareContext() → StatusStore
│   │   ├── daily-summary.ts              # Daily KV parsing + tz-aware history
│   │   ├── minute-map.ts
│   │   ├── minute-cells.ts
│   │   ├── decode-status.ts
│   │   ├── date-range.ts
│   │   ├── derive-minute-uptime.ts
│   │   ├── load-status-sequence.ts
│   │   ├── status-data.ts
│   │   ├── status-api-url.ts
│   │   ├── brand-filter.ts
│   │   ├── brand-status.ts
│   │   └── brand-navbar.ts
│   ├── config.ts
│   ├── types.ts
│   └── utils/cookies.ts
├── tests/
│   ├── unit/                             # node:test via tsx (tests/unit/*.test.ts)
│   └── e2e/                              # Playwright, fully parallel
├── public/static/img/                    # Logos and assets
├── wrangler.jsonc                        # Worker entry, ASSETS, nodejs_compat, KV
├── open-next.config.ts
├── next.config.ts
└── package.json
```

Removed legacy paths (do not reference): `components/Navbar/`, `components/Footer/`, `components/ThemeToggle/`, `ServiceChecker.ts`, `HistoryManager.ts`, `App.css`.

## Building and Running

```bash
npm run dev         # http://localhost:3000 (bindings via initOpenNextCloudflareForDev)
npm run build       # Next.js production build
npm run start       # serve the Next.js build locally
npm run lint
npm test            # test:unit, then test:e2e
npm run test:unit   # node:test via tsx (tests/unit/*.test.ts)
npm run test:e2e    # Playwright (fully parallel; CI workers 100%)
npm run preview     # OpenNext build + local Workers preview
npm run deploy      # OpenNext build + deploy to Workers
npm run upload      # OpenNext build + upload a version without deploying
npm run cf-typegen  # regenerate CloudflareEnv types
```

## Configuration

### `src/config.ts`

- `SERVICES_BY_BRAND` — UI display metadata per brand (names, icons, endpoint URLs for tooltips)
- `BRANDS` — Brand labels and Thai descriptions
- `TIMEOUT_MS`, `DEGRADED_THRESHOLD_MS` — Used by pulse worker thresholds (documented here for reference)

**Important:** Service health is **not** checked in this repo at runtime. The pulse worker writes results to KV; this app reads KV via `/api/status`.

### Cloudflare configuration

- `wrangler.jsonc` declares the Worker entry (`.open-next/worker.js`), the `ASSETS` binding, `nodejs_compat`, and the `STATUS_HISTORY` KV namespace.
- `open-next.config.ts` holds the OpenNext Cloudflare adapter config.
- `next.config.ts` calls `initOpenNextCloudflareForDev()` during development so local `next dev` can use the bindings.
- API routes resolve KV through `getStatusStore()` in `src/lib/status-kv.ts`, which uses `getCloudflareContext()` and falls back to an empty store when no binding is available.

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
| Unit | `npm run test:unit` | `tests/unit/*.test.ts` — `lib/` contracts (brand filter, status data, load sequence, API URL, minute uptime, brand navbar) |
| E2E | `npm run test:e2e` | `tests/e2e/*.spec.ts` — page load, brand switch, mosaic hover, loading states, API, mobile, cookie contrast; split by feature |

`npm test` runs unit tests, then Playwright. Playwright uses `fullyParallel: true` and `workers: '100%'` in CI.

## API Endpoints

### `GET /api/status`

Query: `tzOffset`, `brand`, `currentOnly`. The route is a thin handler: it loads `config:services` with `loadServicesConfig()`, then delegates to `buildCurrentStatusResponse()` or `buildFullStatusResponse()`. Both builders receive a `StatusStore` from `getStatusStore()` (the `STATUS_HISTORY` binding).

### `GET /api/minutes/[serviceId]/[date]`

Returns a 1440-element array. Parses `m:{serviceId}` with `parseMinuteMap()` and maps KV epochs to local minute indices with `buildMinuteCells()` using `tzOffset`.

## Notes

### `lib/` modules

| File | Exports |
|------|---------|
| `status-policy.ts` | `aggregateStatus`, `statusFromUptime`, `calculateOperationalPct`, uptime thresholds |
| `status-response.ts` | `StatusStore`, `loadServicesConfig`, `buildCurrentStatusResponse`, `buildFullStatusResponse` |
| `status-kv.ts` | `getStatusStore()` — `STATUS_HISTORY` via `getCloudflareContext()`, empty-store fallback |
| `daily-summary.ts` | `parseDailySummary`, `readDailyHistory`, `currentStatusFromDaily` |
| `minute-map.ts` | `parseMinuteMap` |
| `minute-cells.ts` | `buildMinuteCells`, `emptyMinuteCells`, `MINUTES_PER_DAY` |
| `decode-status.ts` | `decodeStatus`, `STATUS_PRIORITY` for daily tz overlap |
| `date-range.ts` | `getTimezoneOffsetMinutes`, `getLast30IsoDates`, `getLast30DateLabels`, `parseTimezoneOffsetParam` |
| `derive-minute-uptime.ts` | `deriveFromMinuteMap` — single-pass current status + 30-day uptime |
| `load-status-sequence.ts` | `loadStatusSequence` — currentOnly → brand-full → all-full |
| `status-data.ts` | `mergeStatusData` — preserves history when fast payload omits it |
| `status-api-url.ts` | `buildStatusApiUrl` |
| `brand-filter.ts` | `filterServicesByBrand`, `isValidBrandParam` |
| `brand-status.ts` | `brandHasHistory`, `countLoadedForBrand`, `serviceHasHistory` |
| `brand-navbar.ts` | `BRAND_NAVBAR` metadata and links |

### Three-phase load sequence

1. **currentOnly** — Badges + response times appear quickly (`history: {}`).
2. **brand-full** — 30-day history for active brand.
3. **all-full** — Cross-brand cache for instant tab switches.

Implemented in `load-status-sequence.ts`; `useStatusData` calls it on mount and re-fetches on brand change (current before full). Manual/periodic refresh fetches badges every minute and full history at most every five minutes. `page.tsx` is a server wrapper that passes `?brand=` down to `StatusPageClient.tsx`, which renders the shell.

### Timezone handling

- Client sends `tzOffset` (minutes east of UTC) on every API call.
- `getLast30IsoDates` builds local calendar days from that offset.
- `readDailyHistory` in `daily-summary.ts` merges the two UTC date keys that overlap a local day and picks the worst status via `STATUS_PRIORITY`.

### Theme & cookies

- Theme: `localStorage` key `theme-preference` via `useTheme` hook.
- Cookies: `cookie-preferences` key; consent banner in `components/cookies/`.

### Fonts

IBM Plex Sans Thai (UI), JetBrains Mono (metrics) — loaded in `layout.tsx`.