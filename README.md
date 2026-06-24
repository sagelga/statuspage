# ByteSide.one Status Page

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com)

Real-time status monitoring page for ByteSide.one and sagelga.com services — Thai technology and gaming brands.

![ByteSide logo](./public/static/img/logo-large.png)

## Features

- **Real-time monitoring** — Service health badges with response times from Cloudflare KV
- **Dual-brand support** — ByteSide.one (5 services) and sagelga.com (7 services) via brand toggle
- **30-day history** — Daily uptime bars and per-minute mosaic drill-down
- **Fast initial load** — Three-phase fetch: current badges → brand history → cross-brand cache
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
npm test          # Unit tests (tsx) + Playwright e2e
npm run lint
```

### Cloudflare Pages

```bash
npm run pages:build
npm run deploy
```

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

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── status/route.ts              # Edge: KV-backed status + history
│   │   └── minutes/[serviceId]/[date]/  # Edge: 1440 minute cells per day
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                         # Client: three-phase load + brand switch
├── components/
│   ├── layout/                          # Navbar, Footer (active)
│   ├── ServiceList/                     # 30-day bars + minute mosaic
│   ├── Hero/                            # Degraded/down banner
│   ├── IncidentHistory/
│   ├── ApiSection/
│   ├── BrandToggle/
│   ├── RefreshTimer/
│   ├── cookies/                         # Consent banner + settings
│   ├── theme/                           # Theme settings modal
│   └── ui/                              # BottomSheet
├── lib/
│   ├── decode-status.ts                 # KV code → ServiceStatus
│   ├── date-range.ts                    # 30-day ISO dates + tz helpers
│   ├── load-status-sequence.ts          # Three-phase client fetch
│   ├── status-data.ts                   # mergeStatusData
│   ├── status-api-url.ts                # /api/status URL builder
│   ├── brand-filter.ts                  # Brand query filtering
│   └── brand-status.ts                  # History readiness helpers
├── config.ts
├── types.ts
├── hooks/useTheme.tsx
└── utils/cookies.ts
tests/
├── unit/                                # tsx node:test (lib contracts)
└── e2e/                                 # Playwright
```

## API

Both routes use **Cloudflare Edge runtime** and read from the `STATUS_HISTORY` KV namespace (written by statuspage-pulse).

### `GET /api/status`

| Query | Description |
|-------|-------------|
| `tzOffset` | Client offset in minutes (default 0, clamped ±12h) |
| `brand` | `byteside` or `sagelga` — filter services |
| `currentOnly` | `true` — skip history/uptime (fast badges) |

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

Returns 1440 status codes (one per minute) for a local calendar day. Uses `tzOffset` to map UTC epochs to local minute indices.

## Notes

### Shared `lib/` modules

| Module | Role |
|--------|------|
| `decode-status.ts` | Maps compact KV codes (`o`/`d`/`x`) and full names to `ServiceStatus` |
| `date-range.ts` | `getLast30IsoDates`, timezone offset parsing, Thai date labels |
| `load-status-sequence.ts` | Client three-phase load: currentOnly → brand-full → all-full |
| `status-data.ts` | Merges partial API responses without losing cached history |
| `status-api-url.ts` | Builds `/api/status` query strings |
| `brand-filter.ts` | Filters KV service list by `?brand=` param |
| `brand-status.ts` | Detects when a brand's 30-day history is fully loaded |

### KV key patterns (pulse worker writes, API reads)

| Key | Content |
|-----|---------|
| `config:services` | Service definitions JSON |
| `m:{serviceId}` | Epoch → status code (minute granularity) |
| `daily:{serviceId}` | Date → daily summary code |
| `ping:{serviceId}` | Latest response time (ms) |

### Edge runtime

API routes export `runtime = 'edge'` for Cloudflare Pages. KV access uses `@cloudflare/next-on-pages` `getRequestContext()`.

## Technologies

- [Next.js 16](https://nextjs.org) — App Router, Edge API routes
- [TypeScript 5](https://typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Cloudflare Pages](https://pages.cloudflare.com) + KV
- IBM Plex Sans Thai + JetBrains Mono

## License

MIT © ByteSide.one

## Contact

- **Website**: [byteside.one](https://byteside.one)
- **Status**: [status.sagelga.com](https://status.sagelga.com)
- **Email**: support@byteside.one