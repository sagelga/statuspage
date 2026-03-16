# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Start local dev server on port 8788 (wrangler dev)
npm run deploy  # Deploy to Cloudflare Workers
npm run tail    # Stream live logs from the deployed worker
```

No test runner or linter is configured. Wrangler compiles TypeScript directly — there is no separate `tsc` build step.

## Architecture

Everything lives in a single file: `src/index.ts`. There are two public routes:

- `GET /` — returns the full HTML status page (built by `buildHtml()`)
- `GET /api/status` — probes all services in parallel and returns a JSON `StatusResponse`

### Request flow

1. `fetch()` handler dispatches on `url.pathname`.
2. For `/api/status`: `handleApiStatus()` calls `Promise.all(SERVICES.map(probeService))`, then returns JSON with an overall status derived from the worst individual result.
3. For `/`: `buildHtml()` returns a self-contained HTML string. The page has **no server-side data** — it fetches `/api/status` client-side on load and auto-refreshes every 60 seconds.

### Service probing logic (`probeService`)

Uses `HEAD` requests with a 5 s `AbortController` timeout. Classification thresholds:
- Response time > `DEGRADED_THRESHOLD_MS` (1500 ms) → `degraded`
- Non-2xx/3xx status code or timeout/network error → `down`
- Otherwise → `operational`

### Adding or changing monitored services

Edit the `SERVICES` array near the top of `src/index.ts`. Each entry needs `id`, `name`, `icon` (emoji), and `url`.

### HTML page design

`buildHtml()` returns a fully inline page (CSS + JS in `<style>`/`<script>` tags, no external assets except Google Fonts and the ByteSide logo image from `https://byteside.one`). The embedded JS uses `var`/function-style (no `const`/`let`) to keep it compatible with the template literal context. Thai UI strings inside the embedded `<script>` are written as Unicode escapes to avoid encoding issues in the TypeScript template literal.

The page matches ByteSide.one's branding: brand color `#52006A`, IBM Plex Sans Thai font, 2-row sticky navbar (row 1: logo + breadcrumb, row 2: category nav links back to `byteside.one`), and a dark footer.
