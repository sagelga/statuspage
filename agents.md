# Agent log

- [2026-11-08] [feat] Add the Thai Pat Metal (thaipatmetal) brand with frontend and backend services, brand theme, navbar, mobile layout, and unit/e2e coverage — files: src/config.ts, src/lib/brand-filter.ts, src/lib/brand-navbar.ts, src/lib/brand-status.ts, src/lib/status-api-url.ts, src/app/page.tsx, src/app/globals.css, src/components/Icons.ts, src/components/BrandToggle/BrandToggle.style.css, src/components/layout/Navbar.css, src/components/layout/StatusNavbar.tsx, tests/unit/brand-filter.test.ts, tests/unit/brand-navbar.test.ts, tests/unit/brand-status.test.ts, tests/e2e/fixtures/api-mock.ts, tests/e2e/status-page.spec.ts, README.md
- [2026-11-08] [chore] Drop the Thai Pat Metal backend/admin probe and keep the brand frontend-only — files: src/config.ts, src/components/Icons.ts, tests/unit/brand-filter.test.ts, tests/unit/brand-status.test.ts, tests/e2e/status-page.spec.ts, README.md
- [2026-11-08] [chore] Refactored status/API/client layers, split ServiceList and e2e specs, migrated to OpenNext Workers, refreshed docs — files: src/app/api/*, src/hooks/useStatusData.ts, src/components/ServiceList/*, src/components/StatusPageClient.tsx, src/lib/status-*.ts, src/lib/daily-summary.ts, src/lib/minute-*.ts, wrangler.jsonc, open-next.config.ts, package.json, README.md

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
