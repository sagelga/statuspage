# ByteSide.one Status Page

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

Real-time status monitoring page for ByteSide.one and sagelga.com services — Thai technology and gaming brands.

![ByteSide logo](./public/static/img/logo-large.png)

## Features

- **Real-time monitoring** — Service health badges with response times from Cloudflare KV
- **Dual-brand support** — ByteSide.one (5 services) and sagelga.com (7 services) via brand toggle
- **30-day history** — Daily uptime bars and per-minute mosaic drill-down
- **Fast initial load** — Three-phase fetch: current badges → brand history → cross-brand cache
- **Workers runtime** — OpenNext adapter on Cloudflare Workers (Node.js runtime), KV-backed API routes
- **Theme toggle** — Light/dark mode with system preference detection
- **Thai language** — Localized interface (IBM Plex Sans Thai)
- **Auto-refresh** — Countdown timer refreshes status every minute

## Monitored Services

Services are defined in the **statuspage-pulse** worker and stored in KV (`config:services`). The UI mirrors them in `src/config.ts` for display and brand filtering.

| Brand | Services |
|-------|----------|
| ByteSide.one | Cloudflare, Website, R2 Content, Notion Sync, Notion DB |
| sagelga.com | sagelga.com, Mahjong Hands, Telegram Thai, Docs, Redirect, Static, Learn |

## Getting Started

### Prerequisites

- Node.js 20+
- npm (or yarn, pnpm, bun)

### Installation

```bash
git clone https://github.com/your-org/statuspage.git
cd statuspage
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

### Testing

```bash
npm test            # test:unit, then test:e2e
npm run test:unit   # node:test via tsx (tests/unit/*.test.ts)
npm run test:e2e    # Playwright (fully parallel; CI runs 100% workers)
npm run lint
```

### Cloudflare Workers

```bash
npm run preview     # OpenNext build + local Workers preview
npm run deploy      # OpenNext build + deploy to Workers
npm run upload      # OpenNext build + upload a version without deploying
npm run cf-typegen  # regenerate CloudflareEnv types from wrangler.jsonc
```

Bindings are declared in `wrangler.jsonc`. `next.config.ts` calls
`initOpenNextCloudflareForDev()` so `npm run dev` can use them locally.

## Configuration

Edit [`src/config.ts`](src/config.ts) for UI display metadata (service names, icons, brand lists). Live health checks and KV keys are owned by the **statuspage-pulse** worker — update that worker to add or remove monitored services.

```typescript
export const SERVICES_BY_BRAND: Record<BrandId, ServiceDefinition[]> = { /* ... */ };
export const TIMEOUT_MS = 5000;
export const DEGRADED_THRESHOLD_MS = 1500;
```

Query params:

| Param | Purpose |
|-------|---------|
| `?brand=sagelga` | Initial brand selection |
| `?tzOffset=420` | Client timezone offset (minutes east of UTC) |
| `?currentOnly=true` | Fast path: badges only, no history |

### Worker configuration

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Worker entry `.open-next/worker.js`, `ASSETS` binding, `nodejs_compat`, `STATUS_HISTORY` KV namespace |
| `open-next.config.ts` | OpenNext Cloudflare adapter configuration |
| `next.config.ts` | Enables `initOpenNextCloudflareForDev()` in development; disables image optimization |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── status/route.ts              # Thin handler: config → response builders
│   │   └── minutes/[serviceId]/[date]/  # 1440 minute cells per local day
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                         # Server wrapper: reads ?brand= for SSR
├── components/
│   ├── StatusPageClient.tsx             # Client shell + brand slice (state in useStatusData)
│   ├── layout/                          # Navbar, Footer, StatusNavbar
│   ├── ServiceList/                     # ServiceList, ServiceRow, UptimeBars, MinuteMosaic, ServiceBadge
│   ├── Hero/                            # Degraded/down banner
│   ├── IncidentHistory/
│   ├── ApiSection/
│   ├── BrandToggle/
│   ├── RefreshTimer/
│   ├── cookies/                         # Consent banner + settings
│   ├── theme/                           # Theme settings modal
│   └── ui/                              # BottomSheet
├── hooks/
│   ├── useStatusData.ts                 # Three-phase load, brand switch, refresh
│   └── useTheme.tsx
├── lib/
│   ├── status-policy.ts                 # Status aggregation + uptime thresholds
│   ├── status-response.ts               # Testable API response builders
│   ├── status-kv.ts                     # Cloudflare binding → StatusStore
│   ├── daily-summary.ts                 # Daily KV parsing + tz-aware history
│   ├── minute-map.ts                    # Minute-map parsing
│   ├── minute-cells.ts                  # 1440 local-minute cells
│   ├── decode-status.ts                 # KV code → ServiceStatus
│   ├── date-range.ts                    # 30-day ISO dates + tz helpers
│   ├── derive-minute-uptime.ts          # Current status + uptime buckets
│   ├── load-status-sequence.ts          # Three-phase client fetch
│   ├── status-data.ts                   # mergeStatusData
│   ├── status-api-url.ts                # /api/status URL builder
│   ├── brand-filter.ts                  # Brand query filtering
│   ├── brand-status.ts                  # History readiness helpers
│   └── brand-navbar.ts                  # Brand navbar metadata
├── config.ts
├── types.ts
└── utils/cookies.ts
tests/
├── unit/                                # node:test via tsx (lib contracts)
└── e2e/                                 # Playwright (parallel, split by feature)
```

## API

Both routes run on **Cloudflare Workers** (Node.js runtime) through the OpenNext adapter and read from the `STATUS_HISTORY` KV namespace (written by statuspage-pulse). Route handlers are thin: `src/lib/status-response.ts` builds testable payloads from an injected `StatusStore`, and `src/lib/status-kv.ts` supplies the real binding via `getCloudflareContext()`.

### `GET /api/status`

| Query | Description |
|-------|-------------|
| `tzOffset` | Client offset in minutes (default 0, clamped ±12h) |
| `brand` | `byteside` or `sagelga` — filter services |
| `currentOnly` | `true` — skip history/uptime (fast badges) |

`/api/status` loads the service list with `loadServicesConfig()` and delegates to `buildCurrentStatusResponse()` or `buildFullStatusResponse()`.

**Response (full):**
```json
{
  "status": "operational",
  "checkedAt": "2026-06-24T10:00:00.000Z",
  "services": [{ "id": "cloudflare", "status": "operational", "responseTime": 120 }],
  "history": { "cloudflare": ["operational", "..."] },
  "dailyUptime": { "cloudflare": [99.5, null, "..."] },
  "dailyFuncUptime": { "cloudflare": [99.8, null, "..."] }
}
```

### `GET /api/minutes/[serviceId]/[date]`

Returns 1440 status codes (one per minute) for a local calendar day. Uses `tzOffset` to map UTC epochs to local minute indices. The handler composes `parseMinuteMap()` and `buildMinuteCells()` from `src/lib/`.

## Notes

### Shared `lib/` modules

| Module | Role |
|--------|------|
| `status-policy.ts` | `aggregateStatus`, `statusFromUptime`, `calculateOperationalPct`; uptime thresholds (99.5% operational, 95% degraded) |
| `status-response.ts` | `loadServicesConfig`, `buildCurrentStatusResponse`, `buildFullStatusResponse`; injected `StatusStore` keeps them unit-testable |
| `status-kv.ts` | `getStatusStore()` resolves the `STATUS_HISTORY` binding via `getCloudflareContext()`; empty-store fallback |
| `daily-summary.ts` | `parseDailySummary`, `readDailyHistory`, `currentStatusFromDaily` — normalizes KV daily payloads and stitches tz-overlapping UTC days |
| `minute-map.ts` | `parseMinuteMap` — validates `m:{serviceId}` epoch maps |
| `minute-cells.ts` | `buildMinuteCells`, `MINUTES_PER_DAY` — 1440 local-minute cells |
| `decode-status.ts` | Maps compact KV codes (`o`/`d`/`x`) and full names to `ServiceStatus` |
| `date-range.ts` | `getLast30IsoDates`, timezone offset parsing, Thai date labels |
| `derive-minute-uptime.ts` | `deriveFromMinuteMap` — current status plus 30-day uptime in one pass |
| `load-status-sequence.ts` | Client three-phase load: currentOnly → brand-full → all-full |
| `status-data.ts` | Merges partial API responses without losing cached history |
| `status-api-url.ts` | Builds `/api/status` query strings |
| `brand-filter.ts` | Filters KV service list by `?brand=` param |
| `brand-status.ts` | Detects when a brand's 30-day history is fully loaded |
| `brand-navbar.ts` | Brand navbar metadata and links |

### KV key patterns (pulse worker writes, API reads)

| Key | Content |
|-----|---------|
| `config:services` | Service definitions JSON |
| `m:{serviceId}` | Epoch → status code (minute granularity) |
| `daily:{serviceId}` | Date → daily summary code |
| `ping:{serviceId}` | Latest response time (ms) |

### Runtime and KV access

API routes do not declare a runtime; they run on the Workers Node.js runtime through OpenNext. `src/lib/status-kv.ts` resolves the `STATUS_HISTORY` binding with `getCloudflareContext()` and falls back to an empty store when no binding is present, so routes return "no data" instead of a 500. Response builders accept the store as an argument, which keeps them unit-testable without Cloudflare bindings.

## Technologies

- [Next.js 16.4.5](https://nextjs.org) — App Router
- [TypeScript 5](https://typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Cloudflare Workers](https://workers.cloudflare.com) + [OpenNext](https://opennext.js.org/cloudflare) + KV
- IBM Plex Sans Thai + JetBrains Mono

## License

MIT © ByteSide.one

## Contact

- **Website**: [byteside.one](https://byteside.one)
- **Status**: [status.sagelga.com](https://status.sagelga.com)
- **Email**: support@byteside.one