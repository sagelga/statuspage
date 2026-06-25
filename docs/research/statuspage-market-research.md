# Status Page Market Research Report

> Research Date: 2026-03-22
> Purpose: Inform the design of the ByteSide Status Page by analyzing 5 top status pages

---

## Executive Summary

We analyzed 5 leading status pages — **GitHub**, **Atlassian Statuspage**, **Cloudflare**, **Discord**, and **Vercel** — to identify common design patterns, best practices, and opportunities for ByteSide to differentiate.

### Key Finding

All 5 pages share a remarkably consistent information architecture and visual pattern. Most are built on Atlassian Statuspage (GitHub, Cloudflare, Discord, Vercel all use it). This creates an opportunity: the "standard" status page is functional but personality-free. ByteSide can stand out with warmth, Thai-first typography, and polished dark mode — things none of these pages offer.

---

## 1. GitHub Status Page (githubstatus.com)

### Layout & Structure
- Single-column, centered layout (`max-width: 850px`, `width: 90%`)
- Vertical stack: Header → Status banner → Subscribe bar → Component list → 90-day uptime view → Incident history → Footer

### Status Display
- Full-width colored banner with aggregate status ("All Systems Operational")
- Banner background changes color based on severity (green → yellow → orange → red)
- Checkmark icon when operational; warning icons when degraded

### Components
10-11 services (Git Operations, Webhooks, API, Issues, PRs, Actions, Packages, Pages, Codespaces, Copilot). Each row shows component name (left) and color-coded status label + icon (right).

### Colors
| Status | Color | Hex |
|---|---|---|
| Operational | Green | `#339966` |
| Degraded | Yellow | `#F1C40F` |
| Partial Outage | Orange | `#E67E22` |
| Major Outage | Red | `#E74C3C` |
| Maintenance | Blue | `#3498DB` |

### Uptime Metrics
- 90-day availability bar chart (added Feb 2026)
- Each day colored on a green-to-red gradient based on downtime minutes
- Regional status pages available (AU, EU, JP, US)

### Incidents
- Lifecycle: Investigating → Identified → Monitoring → Resolved → Postmortem
- Reverse-chronological, grouped by date
- Impact levels: None / Minor / Major / Critical

### Typography
System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI"...`). Font sizes: regular (16px), large (20px), largest (28px).

### Notable Features
- Subscribe via email, SMS, webhook, Atom, RSS
- Component-level subscriptions
- Full REST API at `/api/v2/`
- Regional status pages

### Gaps
- **No dark mode**
- No brand personality — purely functional
- Generic system fonts

---

## 2. Atlassian Statuspage (status.atlassian.com)

### Layout & Structure
- Single-column centered layout (same ~850px max-width pattern)
- Vertical stack: Masthead → Status banner → Components → Scheduled maintenance → Past incidents → Footer

### Status Display
- Full-width colored banner, auto-calculated from worst component status
- Triple-redundant status: **color + icon + text label** (accessibility best practice)
- Green checkmark = Operational, yellow warning = Degraded, red exclamation = Major outage

### Components
- Rows with name (left) and status indicator (right)
- **Collapsible groups** with disclosure triangles — collapsed view shows rolled-up worst status
- Uptime showcase: 90-day bar beneath each component when enabled

### Colors
Same Flat UI palette as GitHub (they share the platform): `#2ecc71` green, `#f1c40f` yellow, `#e67e22` orange, `#e74c3c` red.

### Uptime Metrics
- 90 thin colored rectangles (1 per day) with hover tooltips
- Uptime percentage displayed (e.g., "99.98%")
- Responsive: 90 days desktop → 60 tablet → 30 mobile
- Partial outage weighted at 30% of major outage in calculations

### Incidents
- 4-phase lifecycle: Investigating → Identified → Monitoring → Resolved
- Postmortems can be published within incident entries
- Scheduled maintenance with auto-start/auto-complete

### Typography
System fonts by default. Google Fonts importable via Custom CSS. Responsive breakpoints at 650px and 450px scale fonts down.

### Notable Features
- **Status embed widgets**: circle badge, alert block, status bar
- **Incident templates** for common scenarios
- **Email automation** — monitoring tools can trigger status changes via email
- Multi-channel subscribe (email, SMS, Slack, Teams, RSS, webhook)

### Gaps
- **No built-in dark mode**
- Functional but personality-free
- Limited customization without CSS overrides

---

## 3. Cloudflare Status Page (cloudflarestatus.com)

### Layout & Structure
- Atlassian Statuspage-powered, same single-column centered layout
- Vertical stack: Header → Subscribe button → Status banner → Component groups → Active incidents → Scheduled maintenance → Past incidents → Footer

### Components
**463 components** organized into **8 groups**:
1. Cloudflare Sites and Services (~109 products)
2. North America (regional data centers)
3. Europe
4. Asia
5. Latin America & Caribbean
6. Africa
7. Middle East
8. Oceania

Each group is a collapsible accordion. Regional groups list individual data centers by airport code (LHR, SIN, GRU, etc.).

### Colors
Same Flat UI palette: green (`#339966`), yellow (`#F1C40F`), orange (`#E67E22`), red (`#E74C3C`), blue (`#3498DB`).

### Uptime Metrics
- 90-day horizontal bar per component
- Hover reveals tooltips with date and incident details
- Extended history at `/uptime` in 3-month increments
- No custom latency/response-time graphs on public page

### Incidents
- Standard Statuspage lifecycle (Investigating → Identified → Monitoring → Resolved)
- Grouped by date, reverse chronological
- Full archive at `/history` with month-by-month navigation
- Maintenance styled distinctly in blue

### Notable Features
- **Hosted completely off Cloudflare's own infrastructure** — remains available during Cloudflare outages
- **Cloudflare Incident Alerts** (launched Oct 2025) — configurable from dashboard with email, PagerDuty, webhook
- Can filter alerts by specific products and impact levels
- Full REST API

### Gaps
- **No dark mode**
- Uses system fonts (no custom typography)
- Information-dense but not warm or branded

---

## 4. Discord Status Page (discordstatus.com)

### Layout & Structure
- Atlassian Statuspage-powered (hosted at `srhpyqt94yxb.statuspage.io`)
- Same vertical stack: Header → Status banner → Metrics → Components → Incident history → Footer

### Status Display
- Full-width colored banner with aggregate status
- Uses Discord's own color palette (slightly different from Statuspage defaults)

### Colors
| Status | Color | Hex |
|---|---|---|
| Operational | Green | `#43B581` |
| Degraded | Yellow | `#FAA61A` |
| Partial Outage | Orange | `#F26522` |
| Major Outage | Red | `#F04747` |
| Maintenance | Gray | `#737F8D` |

Discord's "Blurple" (`#5865F2`) appears in header/logo branding.

### Components
Services include: API, Gateway, Voice, Media Proxy, Push Notifications, Search, Third-party, CloudFlare. Some components use `only_show_if_degraded: true` — hidden when operational.

### Incidents
- 5-stage lifecycle: Investigating → Identified → Monitoring → Resolved → Postmortem
- Each incident gets a shareable `stspg.io` short URL
- `custom_tweet` field for social media coordination

### Notable Features
- **Conditional component visibility** — components hidden when healthy, shown only when degraded
- **Incident shortlinks** for easy sharing
- **Social media integration** — incidents linked to tweets
- Calendar-based history navigation

### Gaps
- **No dark mode** (ironic given Discord's famously dark app)
- Minimal brand personality on status page
- System fonts only

---

## 5. Vercel Status Page (vercel-status.com)

### Layout & Structure
- Atlassian Statuspage-powered, same centered single-column layout
- 56 components in 7 collapsible groups (Edge Network with regional sub-components by airport code)

### Colors
| Status | Color | Hex (Geist) |
|---|---|---|
| Operational | Green | `#00DC82` |
| Degraded | Amber | `#FFAA00` |
| Major Outage | Red | `#FF0000` |
| Maintenance | Blue | `#0070F3` |

### Vercel Design System Insights (Geist)
Vercel's own Geist design system provides valuable guidelines applicable to status pages:
- **Status Dot component** with states: Queued, Building, Error, Ready, Canceled
- **"Redundant status cues"** — never rely on color alone; always include text labels
- **`font-variant-numeric: tabular-nums`** for all numerical data (ensures columns align)
- **Stable skeletons** — loading states mirror final content to prevent layout shift
- **Minimum loading-state duration** — show spinner for at least 300-500ms to avoid flicker
- **URL as state** — persist filter/view state in URL for shareability

### Notable Features from Modern Alternatives

**Instatus** (modern Statuspage competitor):
- 3 theme presets: Simple, Panda, Stormtrooper
- **Built-in dark mode** with toggle + system preference
- Separate logo upload for dark mode
- 30+ language translations
- "Time-machine" for historical browsing
- Embeddable widgets: floating badge, footer badge, Intercom embed
- Custom HTML/CSS injected statically (no FOUC)
- Duration of outages shown by bar length (not just color)

**BetterStack**:
- First-class **light/dark/system** theme support
- Horizontal and vertical layout options
- Password-protected and IP-allowlisted private status pages
- Built-in synthetic monitoring (HTTP, ping, SSL, cron, port) feeds directly into status page
- Widget types: plain, history, response_times, chart_only

---

## Cross-Cutting Analysis

### Common Patterns (present in all 5)

| Pattern | Details |
|---|---|
| **Layout** | Single-column, centered, max-width ~850px |
| **Status banner** | Full-width colored banner at top with aggregate status |
| **Color system** | Green → Yellow → Orange → Red severity scale |
| **Component list** | Vertical rows, name left, status indicator right |
| **Collapsible groups** | Accordion pattern for organizing many components |
| **Incident lifecycle** | Investigating → Identified → Monitoring → Resolved |
| **Incident history** | Reverse-chronological, grouped by date |
| **Uptime visualization** | 90-day horizontal bar chart with per-day coloring |
| **Subscribe options** | Email, SMS, RSS/Atom, webhook |
| **API access** | REST API for programmatic access |

### Status Color Consensus

All pages use the same traffic-light metaphor:
- **Green** = All clear
- **Yellow/Amber** = Degraded but functional
- **Orange** = Partial outage
- **Red** = Major outage
- **Blue** = Scheduled maintenance

### What None of Them Do Well

| Gap | Opportunity for ByteSide |
|---|---|
| **Dark mode** | 0/5 have built-in dark mode (only modern alternatives like Instatus/BetterStack do) |
| **Brand personality** | All are clinical and generic — no warmth, no voice |
| **Custom typography** | All use system fonts — no typographic identity |
| **Non-Latin script optimization** | Zero consideration for Thai or other complex scripts |
| **Micro-animations** | Static pages with no motion design |
| **Mobile-first design** | Responsive but not mobile-optimized (just scaled-down desktop) |

---

## Recommendations for ByteSide

### Must-Have (Table Stakes)
1. **Overall status banner** — full-width, color-coded, immediately scannable
2. **Component list** with per-service status (color + icon + text label)
3. **Incident timeline** with lifecycle stages and timestamps
4. **90-day uptime visualization** — bar chart or equivalent
5. **Subscribe to updates** — at minimum email and RSS
6. **Responsive layout** — single-column, max-width constrained

### Differentiators (Where ByteSide Can Win)
1. **Polished dark mode** with system preference detection + manual toggle
2. **IBM Plex Sans Thai typography** — a clear identity advantage; no competitor optimizes for Thai script
3. **ByteSide purple (`#52006A`) as accent** — warm card borders, subtle header touches, not dominant
4. **Playful, honest tone** — "Everything's running smoothly" instead of "All Systems Operational"
5. **Smooth micro-animations** — status transitions, card hover effects, loading states (subtle, never decorative)
6. **Modern card-based layout** — rounded corners, subtle shadows, instead of flat Statuspage rows
7. **Mobile-first design** — designed for the phone-in-hand frustrated user, not scaled-down desktop

### Design Tokens to Adopt

```
Status Colors:
  --status-operational: #22C55E (green)
  --status-degraded:    #F59E0B (amber)
  --status-partial:     #F97316 (orange)
  --status-major:       #EF4444 (red)
  --status-maintenance: #3B82F6 (blue)

Brand:
  --brand-purple:       #52006A
  --brand-purple-light: #7B1FA2

Typography:
  --font-body: 'IBM Plex Sans Thai', sans-serif
  --font-mono: 'JetBrains Mono', monospace
  --font-size-body: 16px (min 14px on mobile)
  --line-height-body: 1.6

Layout:
  --max-width: 850px
  --card-radius: 12px
  --spacing-section: 32px
```

### Information Architecture

```
┌─────────────────────────────────────────┐
│  ByteSide Logo          [Subscribe] 🌙  │  ← Header with dark mode toggle
├─────────────────────────────────────────┤
│  ✅ ทุกระบบทำงานปกติ                      │  ← Status banner (Thai-first)
│     Everything's running smoothly        │     with English subtitle
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🟢 เว็บไซต์หลัก    ทำงานปกติ      │    │  ← Service cards
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  99.9%   │    │     with uptime bars
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🟢 API             ทำงานปกติ      │    │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  99.8%   │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🟡 CDN             ช้าลงเล็กน้อย   │    │
│  │    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  98.5%   │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  📋 ประวัติเหตุการณ์                       │  ← Incident history
│                                         │
│  วันนี้ — ไม่มีเหตุการณ์                     │
│                                         │
│  20 มี.ค. 2026                          │
│  ┌─────────────────────────────────┐    │
│  │ 🟡 CDN ช้าลงในบางพื้นที่            │    │
│  │ 14:30 กำลังตรวจสอบ                 │    │
│  │ 14:45 พบสาเหตุแล้ว                  │    │
│  │ 15:10 แก้ไขเรียบร้อย ✅              │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  Footer · Powered by ByteSide           │
└─────────────────────────────────────────┘
```

---

## Sources

### GitHub
- [Updated GitHub Status Page Experience (Feb 2026)](https://github.blog/changelog/2026-02-13-updated-status-experience/)
- [Introducing the New GitHub Status Site](https://github.blog/engineering/infrastructure/introducing-the-new-github-status-site/)

### Atlassian Statuspage
- [Statuspage Features & Benefits](https://www.atlassian.com/software/statuspage/features)
- [Statuspage Customization & Branding](https://www.atlassian.com/software/statuspage/features/customization)
- [Statuspage Examples: 24 Status Pages](https://www.atlassian.com/blog/statuspage/statuspage-examples-25-status-pages-showcasing-excellent-customization-design-incident-communication)
- [Custom CSS Documentation](https://support.atlassian.com/statuspage/docs/use-custom-css-on-a-status-page/)
- [Historical Uptime Display](https://support.atlassian.com/statuspage/docs/display-historical-uptime-of-components/)

### Cloudflare
- [Cloudflare Status](https://www.cloudflarestatus.com/)
- [Announcing Cloudflare Incident Alerts](https://blog.cloudflare.com/incident-alerts/)

### Discord
- [Discord Status](https://discordstatus.com/)

### Vercel & Modern Alternatives
- [Vercel Status](https://www.vercel-status.com/)
- [Vercel Geist Design System](https://vercel.com/design/guidelines)
- [Instatus Features](https://instatus.com/blog/statuspage-features)
- [BetterStack Status Page](https://betterstack.com/status-page)
