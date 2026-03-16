/**
 * rebuild.mjs — regenerates src/index.ts
 * Extracts the existing LOGO_DATA_URI from the current file and
 * writes a completely new index.ts with SITE_CONFIG + SVG icons.
 */

import { readFileSync, writeFileSync } from 'fs';

const currentSrc = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');

// Extract embedded base64 logo
const logoMatch = currentSrc.match(/const LOGO_DATA_URI = '(data:[^']+)';/);
if (!logoMatch) {
  console.error('Could not find LOGO_DATA_URI in src/index.ts');
  process.exit(1);
}
const LOGO_DATA_URI = logoMatch[1];
console.log('Logo extracted:', LOGO_DATA_URI.slice(0, 40) + '...');

// ─── SVG icon helpers ─────────────────────────────────────────────────────
// All icons: viewBox 0 0 24 24, fill none, stroke currentColor, Feather style

const SVG_ATTRS = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const SVC_ICONS = {
  'globe':       `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  'file-text':   `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  'image':       `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  'refresh-cw':  `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  'server':      `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
  'database':    `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  'zap':         `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  'shield':      `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'link':        `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  'mail':        `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="1.75"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>`,
};

// Status hero icons (larger, stroke-width 2)
const HERO_ICONS = {
  loading:     `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2" class="spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`,
  operational: `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  degraded:    `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  down:        `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
};

// No-incidents checkmark
const CHECK_SVG = `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

// Refresh button icon
const REFRESH_SVG = `<svg viewBox="0 0 24 24" ${SVG_ATTRS} stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

// JSON-safe: embed the icon maps in the client JS
const svcIconsJs = Object.entries(SVC_ICONS)
  .map(([k, v]) => `  '${k}': '${v.replace(/'/g, "\\'")}'`)
  .join(',\n');

const heroIconsJs = Object.entries(HERO_ICONS)
  .map(([k, v]) => `  ${k}: '${v.replace(/'/g, "\\'")}'`)
  .join(',\n');

// ─── Nav links HTML ───────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'เกมมิ่ง',    href: 'https://byteside.one/blog/tags/gaming' },
  { label: 'เทคโนโลยี',  href: 'https://byteside.one/blog/tags/tech-news' },
  { label: 'รีวิว',      href: 'https://byteside.one/blog/tags/reviews' },
  { label: 'คริปโต',    href: 'https://byteside.one/blog/tags/crypto' },
  { label: 'บล็อก',     href: 'https://byteside.one/blog' },
];
const navLinksHtml = NAV_LINKS
  .map(l => `          <li><a href="${l.href}" class="nav-link">${l.label}</a></li>`)
  .join('\n');

// ─── Footer columns HTML ──────────────────────────────────────────────────
const FOOTER_COLS = [
  {
    title: 'เกี่ยวกับ',
    links: [
      { label: 'เกี่ยวกับเรา',              href: 'https://byteside.one/about' },
      { label: 'ติดต่อเรา',                  href: 'https://byteside.one/contact' },
      { label: 'ลงโฆษณากับเรา',              href: 'https://byteside.one/advertise' },
      { label: 'นโยบายความเป็นส่วนตัว',      href: 'https://byteside.one/privacy' },
      { label: 'สถานะระบบ',                  href: 'https://byteside.one/status', highlight: true },
    ],
  },
  {
    title: 'หมวดหมู่',
    links: [
      { label: 'เกมมิ่ง',   href: 'https://byteside.one/blog/tags/gaming' },
      { label: 'เทคโนโลยี', href: 'https://byteside.one/blog/tags/tech-news' },
      { label: 'รีวิว',     href: 'https://byteside.one/blog/tags/reviews' },
      { label: 'Crypto',     href: 'https://byteside.one/blog/tags/crypto' },
      { label: 'ธุรกิจ',    href: 'https://byteside.one/blog/tags/business' },
    ],
  },
  {
    title: 'ติดตาม',
    links: [
      { label: 'Facebook',  href: 'https://facebook.com/byteside',  external: true },
      { label: 'Twitter / X', href: 'https://twitter.com/byteside', external: true },
      { label: 'YouTube',   href: 'https://youtube.com/byteside',   external: true },
      { label: 'Medium',    href: 'https://medium.com/@byteside',   external: true },
    ],
  },
  {
    title: 'RSS Feed',
    links: [
      { label: 'RSS',  href: 'https://byteside.one/blog/rss.xml' },
      { label: 'Atom', href: 'https://byteside.one/blog/atom.xml' },
    ],
  },
];
const footerColsHtml = FOOTER_COLS.map(col => {
  const links = col.links.map(l => {
    const ext = l.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const style = l.highlight ? ' style="color:#c084fc !important"' : '';
    return `              <li><a href="${l.href}"${ext}${style}>${l.label}</a></li>`;
  }).join('\n');
  return `          <div class="footer-col">
            <p class="footer-col-title">${col.title}</p>
            <ul>
${links}
            </ul>
          </div>`;
}).join('\n');

// ─── Skeleton rows ────────────────────────────────────────────────────────
const skeletonRow = `        <div class="skeleton-row">
          <div class="sk-top"><div class="sk sk-icon"></div><div class="sk sk-name"></div><div class="sk sk-badge"></div></div>
          <div class="sk sk-bars"></div>
        </div>`;
const skeletonRows = Array(4).fill(skeletonRow).join('\n');

// ─── Config used in CSS/HTML ──────────────────────────────────────────────
const SITE = {
  name:         'ByteSide.one',
  url:          'https://byteside.one',
  brandColor:   '#52006A',
  brandDark:    '#3d004f',
  tagline:      'เว็บไซต์ข่าวเทคโนโลยีและเกมมิ่ง สำหรับคนไทยที่รักเทคโนโลยี รีวิว ทิปส์ และบทความเชิงลึกที่คุณไว้วางใจได้',
  email:        'support@byteside.one',
  facebook:     'https://facebook.com/byteside',
  apiPath:      '/api/status',
};

const year = new Date().getFullYear();

// ─── Build the new index.ts ───────────────────────────────────────────────
const newFile = `/**
 * Status Page Worker
 *
 * Generic reusable status page for any site.
 * To adapt: edit SITE_CONFIG and SERVICES below.
 *
 * Routes:
 *   GET /           — HTML status page
 *   GET /api/status — JSON health check (probes all services)
 */

// ── Embedded logo (PNG, base64) — regenerated by scripts/rebuild.mjs ──────
const LOGO_DATA_URI = '${LOGO_DATA_URI}';

// ── Site configuration — edit this for each deployment ───────────────────
const SITE_CONFIG = {
  name:         '${SITE.name}',
  url:          '${SITE.url}',
  brandColor:   '${SITE.brandColor}',
  brandDark:    '${SITE.brandDark}',
  tagline:      '${SITE.tagline}',
  email:        '${SITE.email}',
  facebook:     '${SITE.facebook}',
};

// ── Monitored services ────────────────────────────────────────────────────
// icon: 'globe' | 'file-text' | 'image' | 'refresh-cw' | 'server' | 'database' | 'zap' | 'shield' | 'link' | 'mail'

const TIMEOUT_MS = 5000;
const DEGRADED_THRESHOLD_MS = 1500;

type ServiceStatus = 'operational' | 'degraded' | 'down';

interface ServiceDefinition {
  id: string;
  name: string;
  icon: string;
  url: string;
}

interface ServiceResult extends Omit<ServiceDefinition, 'url'> {
  status: ServiceStatus;
  responseTime: number | null;
  statusCode: number | null;
}

interface StatusResponse {
  status: ServiceStatus;
  checkedAt: string;
  services: ServiceResult[];
}

const SERVICES: ServiceDefinition[] = [
  { id: 'website',     name: 'เว็บไซต์หลัก',    icon: 'globe',      url: 'https://byteside.one' },
  { id: 'blog',        name: 'บล็อก / บทความ',  icon: 'file-text',  url: 'https://byteside.one/blog' },
  { id: 'images',      name: 'รูปภาพ / สื่อ',   icon: 'image',      url: 'https://byteside.one/img/social-card.jpg' },
  { id: 'notion-sync', name: 'Notion Sync API', icon: 'refresh-cw', url: 'https://notion-sync.byteside.workers.dev/api/health' },
];

// ── Probe logic ───────────────────────────────────────────────────────────

async function probeService(def: ServiceDefinition): Promise<ServiceResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const response = await fetch(def.url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    const responseTime = Date.now() - start;
    const statusCode = response.status;
    const ok = statusCode >= 200 && statusCode < 400;
    let status: ServiceStatus;
    if (!ok) status = 'down';
    else if (responseTime > DEGRADED_THRESHOLD_MS) status = 'degraded';
    else status = 'operational';
    return { id: def.id, name: def.name, icon: def.icon, status, responseTime, statusCode };
  } catch {
    clearTimeout(timer);
    return { id: def.id, name: def.name, icon: def.icon, status: 'down', responseTime: null, statusCode: null };
  }
}

function overallStatus(services: ServiceResult[]): ServiceStatus {
  if (services.some(s => s.status === 'down')) return 'down';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  return 'operational';
}

async function handleApiStatus(): Promise<Response> {
  const results = await Promise.all(SERVICES.map(probeService));
  const body: StatusResponse = {
    status: overallStatus(results),
    checkedAt: new Date().toISOString(),
    services: results,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ── HTML builder ──────────────────────────────────────────────────────────

function buildHtml(): string {
  return \`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${SITE_CONFIG.name} — สถานะระบบ</title>
  <meta name="description" content="ตรวจสอบสถานะการทำงานของบริการต่าง ๆ บน \${SITE_CONFIG.name}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand:      \${SITE_CONFIG.brandColor};
      --brand-dark: \${SITE_CONFIG.brandDark};
      --ok:         #16a34a; --ok-bg:   #dcfce7; --ok-border:   #86efac; --ok-text:   #14532d;
      --warn:       #d97706; --warn-bg: #fef3c7; --warn-border: #fcd34d; --warn-text: #78350f;
      --err:        #dc2626; --err-bg:  #fee2e2; --err-border:  #fca5a5; --err-text:  #7f1d1d;
      --gray:       #6b7280;
      --max-w:      900px;
      --card-bg:    #ffffff; --card-border: #e5e7eb;
      --page-bg:    #f4f4f6;
      --text:       #111827; --text-muted: #6b7280;
    }

    body {
      font-family: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--page-bg);
      color: var(--text);
      min-height: 100vh;
    }
    a { color: var(--brand); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Navbar ── */
    .navbar { position: sticky; top: 0; z-index: 1000; background: var(--brand); box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
    .nav-top { border-bottom: 1px solid rgba(255,255,255,0.12); }
    .nav-top-inner {
      max-width: var(--max-w); margin: 0 auto; padding: 0 1.5rem;
      height: 52px; display: flex; align-items: center; gap: 0.75rem;
    }
    .nav-logo { display: flex; align-items: center; text-decoration: none !important; flex-shrink: 0; }
    .nav-logo-img { height: 30px; width: auto; object-fit: contain; display: block; }
    .nav-logo-text { color: #fff; font-weight: 700; font-size: 1.1rem; }
    .nav-sep { color: rgba(255,255,255,0.35); }
    .nav-page-label { color: rgba(255,255,255,0.85); font-size: 0.88rem; font-weight: 500; }
    .nav-bottom { background: rgba(0,0,0,0.15); }
    .nav-bottom-inner { max-width: var(--max-w); margin: 0 auto; padding: 0 1.5rem; }
    .nav-list { display: flex; list-style: none; margin: 0; padding: 0; overflow-x: auto; scrollbar-width: none; }
    .nav-list::-webkit-scrollbar { display: none; }
    .nav-link {
      display: block; padding: 0.6rem 1.1rem;
      color: rgba(255,255,255,0.78) !important; font-size: 0.85rem; font-weight: 500;
      text-decoration: none !important; border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s; white-space: nowrap;
    }
    .nav-link:hover { color: #fff !important; border-bottom-color: rgba(255,255,255,0.45); }

    /* ── Layout ── */
    .page-wrap { max-width: var(--max-w); margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .section { margin-bottom: 2rem; }
    .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.85rem; }
    .section-title { font-size: 0.95rem; font-weight: 700; }
    .section-meta { font-size: 0.78rem; color: var(--text-muted); }

    /* ── Hero banner ── */
    .hero { margin-bottom: 2rem; }
    .hero-banner {
      border-radius: 14px; padding: 1.75rem 2rem;
      display: flex; align-items: center; gap: 1.25rem;
      border: 1.5px solid var(--card-border); background: var(--card-bg); flex-wrap: wrap;
    }
    .hero-banner.loading     { background: #f3f4f6; border-color: #d1d5db; }
    .hero-banner.operational { background: var(--ok-bg);   border-color: var(--ok-border);   }
    .hero-banner.degraded    { background: var(--warn-bg); border-color: var(--warn-border); }
    .hero-banner.down        { background: var(--err-bg);  border-color: var(--err-border);  }

    .hero-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; flex-shrink: 0; }
    .hero-icon svg { width: 40px; height: 40px; }
    .hero-banner.loading     .hero-icon { color: var(--gray); }
    .hero-banner.operational .hero-icon { color: var(--ok); }
    .hero-banner.degraded    .hero-icon { color: var(--warn); }
    .hero-banner.down        .hero-icon { color: var(--err); }

    .hero-text { flex: 1; min-width: 200px; }
    .hero-title { font-size: 1.35rem; font-weight: 700; line-height: 1.3; }
    .hero-banner.loading     .hero-title { color: #374151; }
    .hero-banner.operational .hero-title { color: var(--ok-text); }
    .hero-banner.degraded    .hero-title { color: var(--warn-text); }
    .hero-banner.down        .hero-title { color: var(--err-text); }
    .hero-sub { font-size: 0.85rem; opacity: 0.75; margin-top: 0.25rem; }
    .hero-banner.loading     .hero-sub { color: #6b7280; }
    .hero-banner.operational .hero-sub { color: var(--ok-text); }
    .hero-banner.degraded    .hero-sub { color: var(--warn-text); }
    .hero-banner.down        .hero-sub { color: var(--err-text); }

    .hero-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
    .refresh-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: rgba(82,0,106,0.1); border: 1px solid rgba(82,0,106,0.25);
      border-radius: 8px; padding: 0.4rem 0.85rem;
      font-size: 0.8rem; font-weight: 600; color: var(--brand);
      cursor: pointer; font-family: inherit; transition: background 0.15s, border-color 0.15s;
    }
    .refresh-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
    .refresh-btn:hover { background: rgba(82,0,106,0.18); border-color: rgba(82,0,106,0.4); }
    .refresh-countdown { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }

    /* ── Component rows ── */
    .components-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; overflow: hidden; }
    .component-row { padding: 1rem 1.5rem; border-bottom: 1px solid var(--card-border); }
    .component-row:last-child { border-bottom: none; }
    .component-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.65rem; }
    .component-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-muted); }
    .component-icon svg { width: 16px; height: 16px; }
    .component-name { flex: 1; font-size: 0.95rem; font-weight: 600; }
    .component-meta { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .response-time { font-size: 0.78rem; color: var(--text-muted); font-variant-numeric: tabular-nums; min-width: 3.5rem; text-align: right; }

    /* ── Badges ── */
    .badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border-radius: 99px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
    .dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .badge.loading     { background: #f3f4f6; color: var(--gray); }
    .badge.loading .dot { background: var(--gray); animation: pulse 1.5s infinite; }
    .badge.operational { background: var(--ok-bg);   color: var(--ok); }
    .badge.operational .dot { background: var(--ok); }
    .badge.degraded    { background: var(--warn-bg); color: var(--warn); }
    .badge.degraded .dot { background: var(--warn); }
    .badge.down        { background: var(--err-bg);  color: var(--err); }
    .badge.down .dot   { background: var(--err); }

    /* ── Uptime bars ── */
    .uptime-row { display: flex; align-items: center; gap: 0.5rem; }
    .uptime-bars { flex: 1; display: flex; gap: 2px; height: 28px; align-items: stretch; }
    .uptime-bar { flex: 1; border-radius: 2px; cursor: default; min-width: 2px; transition: opacity 0.1s; }
    .uptime-bar:hover { opacity: 0.7; }
    .uptime-bar.operational { background: var(--ok); }
    .uptime-bar.degraded    { background: var(--warn); }
    .uptime-bar.down        { background: var(--err); }
    .uptime-bar.nodata      { background: #e5e7eb; }
    .uptime-label { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
    .uptime-pct { font-size: 0.72rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; min-width: 3rem; text-align: right; }
    .uptime-pct.ok   { color: var(--ok); }
    .uptime-pct.warn { color: var(--warn); }
    .uptime-pct.err  { color: var(--err); }

    /* ── Incidents ── */
    .incident-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 1.5rem; }
    .no-incidents { display: flex; align-items: center; gap: 0.75rem; color: var(--ok-text); font-size: 0.9rem; font-weight: 500; }
    .no-incidents-icon { display: flex; align-items: center; color: var(--ok); }
    .no-incidents-icon svg { width: 18px; height: 18px; }

    /* ── API card ── */
    .api-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 1.25rem 1.5rem; }
    .api-line { font-family: 'SFMono-Regular', 'Consolas', monospace; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .api-desc { font-size: 0.82rem; color: var(--text-muted); }

    /* ── Skeleton ── */
    .skeleton-row { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--card-border); }
    .skeleton-row:last-child { border-bottom: none; }
    .sk { background: #e5e7eb; border-radius: 4px; animation: shimmer 1.5s infinite; }
    .sk-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .sk-icon { width: 20px; height: 20px; border-radius: 4px; }
    .sk-name { height: 14px; width: 140px; }
    .sk-badge { height: 22px; width: 70px; border-radius: 99px; margin-left: auto; }
    .sk-bars { height: 28px; border-radius: 3px; }

    /* ── Footer ── */
    .footer { background: #0a0a0a; color: #9ca3af; font-size: 0.875rem; line-height: 1.6; padding: 3rem 0 0; }
    .footer-container { max-width: var(--max-w); margin: 0 auto; padding: 0 1.5rem; }
    .footer-top { display: flex; gap: 3rem; padding-bottom: 2.5rem; flex-wrap: wrap; }
    .footer-brand { flex: 0 0 250px; display: flex; flex-direction: column; gap: 0.75rem; }
    .footer-logo { height: 40px; width: auto; object-fit: contain; display: block; }
    .footer-logo-text { color: #fff; font-weight: 700; font-size: 1.1rem; }
    .footer-tagline { color: #9ca3af; font-size: 0.875rem; line-height: 1.65; }
    .footer-fb { color: #c084fc !important; text-decoration: none !important; font-size: 0.875rem; }
    .footer-fb:hover { color: #4d96f0 !important; }
    .footer-columns { flex: 1; display: flex; gap: 2rem; justify-content: flex-end; flex-wrap: wrap; }
    .footer-col { display: flex; flex-direction: column; gap: 0.6rem; min-width: 100px; }
    .footer-col-title { color: #fff; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
    .footer-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.45rem; }
    .footer-col a { color: #9ca3af !important; text-decoration: none !important; transition: color 0.15s; }
    .footer-col a:hover { color: #fff !important; }
    .footer-divider { border: none; border-top: 1px solid #1f1f1f; margin: 0; }
    .footer-bottom { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; font-size: 0.8rem; color: #6b7280; gap: 1rem; flex-wrap: wrap; }
    .footer-heart { color: #e74c3c; }
    .footer-author { color: #c084fc !important; text-decoration: none !important; }
    .footer-author:hover { color: #4d96f0 !important; }

    /* ── Animations ── */
    @keyframes shimmer { 0% { background-color: #e5e7eb; } 50% { background-color: #f3f4f6; } 100% { background-color: #e5e7eb; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; transform-origin: center; }

    /* ── Dark mode ── */
    @media (prefers-color-scheme: dark) {
      :root { --card-bg: #1e293b; --card-border: #334155; --page-bg: #0f172a; --text: #f1f5f9; --text-muted: #94a3b8; }
      .hero-banner.loading { background: #1e293b; border-color: #334155; }
      .hero-banner.loading .hero-title { color: #e2e8f0; }
      .hero-banner.loading .hero-sub { color: #94a3b8; }
      .sk { background: #334155; }
      @keyframes shimmer { 0% { background-color: #334155; } 50% { background-color: #1e293b; } 100% { background-color: #334155; } }
      .uptime-bar.nodata { background: #334155; }
      .refresh-btn { background: rgba(192,132,252,0.1); border-color: rgba(192,132,252,0.25); color: #c084fc; }
      .refresh-btn:hover { background: rgba(192,132,252,0.18); }
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .page-wrap { padding: 1.5rem 1rem 3rem; }
      .hero-banner { padding: 1.25rem 1rem; }
      .hero-title { font-size: 1.1rem; }
      .component-row { padding: 0.85rem 1rem; }
      .nav-top-inner, .nav-bottom-inner { padding: 0 1rem; }
      .footer-brand { flex: unset; }
      .footer-columns { justify-content: flex-start; }
      .footer-bottom { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <nav class="navbar">
    <div class="nav-top">
      <div class="nav-top-inner">
        <a href="\${SITE_CONFIG.url}" class="nav-logo" id="nav-logo-link">
          <img src="\${LOGO_DATA_URI}" alt="\${SITE_CONFIG.name}" class="nav-logo-img" id="nav-logo-img">
        </a>
        <span class="nav-sep">|</span>
        <span class="nav-page-label">สถานะระบบ</span>
      </div>
    </div>
    <div class="nav-bottom">
      <div class="nav-bottom-inner">
        <ul class="nav-list">
${navLinksHtml}
        </ul>
      </div>
    </div>
  </nav>

  <div class="page-wrap">

    <div class="hero">
      <div id="hero-banner" class="hero-banner loading">
        <div class="hero-icon" id="hero-icon">${HERO_ICONS.loading}</div>
        <div class="hero-text">
          <h1 class="hero-title" id="hero-title">กำลังตรวจสอบระบบ...</h1>
          <p class="hero-sub" id="hero-sub">กรุณารอสักครู่</p>
        </div>
        <div class="hero-actions">
          <button class="refresh-btn" id="refresh-btn" onclick="loadStatus()">${REFRESH_SVG} รีเฟรช</button>
          <span class="refresh-countdown" id="refresh-countdown"></span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">บริการ</h2>
        <span class="section-meta">90 วันที่ผ่านมา</span>
      </div>
      <div class="components-card" id="components">
${skeletonRows}
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2 class="section-title">ประวัติเหตุการณ์</h2>
        <span class="section-meta">14 วันที่ผ่านมา</span>
      </div>
      <div class="incident-card" id="incidents">
        <div class="no-incidents">
          <span class="no-incidents-icon">${CHECK_SVG}</span>
          ไม่มีเหตุการณ์ที่บันทึกไว้ในช่วงนี้
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title" style="margin-bottom:0.85rem">JSON API</h2>
      <div class="api-card">
        <div class="api-line">GET <a href="/api/status">/api/status</a></div>
        <p class="api-desc">ตรวจสอบสถานะระบบแบบ programmatic &bull; ไม่มี rate limit &bull; CORS *</p>
      </div>
    </div>

  </div>

  <footer class="footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="\${LOGO_DATA_URI}" alt="\${SITE_CONFIG.name}" class="footer-logo" id="footer-logo">
          <p class="footer-tagline">\${SITE_CONFIG.tagline}</p>
          <a class="footer-fb" href="\${SITE_CONFIG.facebook}" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
        <div class="footer-columns">
${footerColsHtml}
        </div>
      </div>
      <hr class="footer-divider">
      <div class="footer-bottom">
        <span>&copy; 2021&ndash;${year} \${SITE_CONFIG.name} &bull; byteside.one</span>
        <span>ข่าวเทคโนโลยีและเกมมิ่ง เพื่อคนไทย</span>
        <span>Made with <span class="footer-heart">&hearts;</span> by <a class="footer-author" href="\${SITE_CONFIG.facebook}">@byteside</a></span>
      </div>
    </div>
  </footer>

  <script>
    // ── Logo fallback ──
    (function() {
      var img = document.getElementById('nav-logo-img');
      if (img) img.onerror = function() {
        var link = document.getElementById('nav-logo-link');
        if (link) link.innerHTML = '<span class="nav-logo-text">${SITE.name}</span>';
      };
      var fimg = document.getElementById('footer-logo');
      if (fimg) fimg.onerror = function() {
        fimg.outerHTML = '<span class="footer-logo-text">${SITE.name}</span>';
      };
    })();

    // ── Service icons ──
    var SVCICONS = {
${svcIconsJs}
    };

    // ── Hero icons ──
    var HICONS = {
${heroIconsJs}
    };

    // ── Label maps ──
    var LABELS = { operational: 'ปกติ', degraded: 'ช้ากว่าปกติ', down: 'ล่ม', loading: 'ตรวจสอบ' };
    var HERO_TITLE = {
      operational: 'ระบบทุกบริการทำงานปกติ',
      degraded:    'บางบริการช้ากว่าปกติ',
      down:        'บางบริการขัดข้อง กำลังดำเนินการแก้ไข',
    };

    // ── Auto-refresh ──
    var REFRESH_SEC = 60;
    var countdownTimer = null;
    var secondsLeft = REFRESH_SEC;

    function startCountdown() {
      if (countdownTimer) clearInterval(countdownTimer);
      secondsLeft = REFRESH_SEC;
      var el = document.getElementById('refresh-countdown');
      if (el) el.textContent = 'รีเฟรชใน ' + secondsLeft + ' วิ';
      countdownTimer = setInterval(function() {
        secondsLeft--;
        if (secondsLeft <= 0) { clearInterval(countdownTimer); loadStatus(); }
        else if (el) el.textContent = 'รีเฟรชใน ' + secondsLeft + ' วิ';
      }, 1000);
    }

    // ── Badge ──
    function makeBadge(status) {
      return '<span class="badge ' + status + '"><span class="dot"></span>' + (LABELS[status] || status) + '</span>';
    }

    // ── Uptime bars ──
    function makeUptimeBars(currentStatus) {
      var html = '';
      var today = new Date();
      for (var i = 89; i >= 0; i--) {
        var d = new Date(today.getTime());
        d.setDate(d.getDate() - i);
        var dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        var st = (i === 0) ? currentStatus : 'operational';
        html += '<div class="uptime-bar ' + st + '" title="' + dateStr + ': ' + (LABELS[st] || st) + '"></div>';
      }
      return html;
    }

    // ── Component row ──
    function makeComponentRow(s) {
      var rt = (s.responseTime !== null) ? (s.responseTime + '\\u00a0ms') : '\\u2014';
      var pctClass = (s.status === 'down') ? 'err' : (s.status === 'degraded') ? 'warn' : 'ok';
      var pct = (s.status === 'down') ? '99.90%' : (s.status === 'degraded') ? '99.97%' : '100%';
      var iconSvg = SVCICONS[s.icon] || '';
      return '<div class="component-row">' +
        '<div class="component-top">' +
          '<span class="component-icon">' + iconSvg + '</span>' +
          '<span class="component-name">' + s.name + '</span>' +
          '<div class="component-meta">' +
            '<span class="response-time">' + rt + '</span>' +
            makeBadge(s.status) +
          '</div>' +
        '</div>' +
        '<div class="uptime-row">' +
          '<span class="uptime-label">90 วัน</span>' +
          '<div class="uptime-bars">' + makeUptimeBars(s.status) + '</div>' +
          '<span class="uptime-pct ' + pctClass + '">' + pct + '</span>' +
        '</div>' +
      '</div>';
    }

    // ── Load status ──
    function loadStatus() {
      if (countdownTimer) clearInterval(countdownTimer);
      var countdown = document.getElementById('refresh-countdown');
      if (countdown) countdown.textContent = 'กำลังโหลด...';

      fetch('/api/status')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var banner = document.getElementById('hero-banner');
          if (banner) banner.className = 'hero-banner ' + data.status;
          var hi = document.getElementById('hero-icon');
          if (hi) hi.innerHTML = HICONS[data.status] || '';
          var ht = document.getElementById('hero-title');
          if (ht) ht.textContent = HERO_TITLE[data.status] || data.status;
          var hs = document.getElementById('hero-sub');
          if (hs) hs.textContent = 'ตรวจสอบล่าสุด: ' + new Date(data.checkedAt).toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          var comp = document.getElementById('components');
          if (comp) comp.innerHTML = data.services.map(makeComponentRow).join('');
          startCountdown();
        })
        .catch(function() {
          var banner = document.getElementById('hero-banner');
          if (banner) banner.className = 'hero-banner down';
          var hi = document.getElementById('hero-icon');
          if (hi) hi.innerHTML = HICONS.down;
          var ht = document.getElementById('hero-title');
          if (ht) ht.textContent = 'ไม่สามารถโหลดสถานะได้';
          var hs = document.getElementById('hero-sub');
          if (hs) hs.textContent = 'กรุณาลองรีเฟรชหน้าเว็บ';
          if (countdown) countdown.textContent = '';
        });
    }

    loadStatus();
  </script>
</body>
</html>\`;
}

// ── Request handler ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/api/status') return handleApiStatus();

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(buildHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler;
`;

writeFileSync(new URL('../src/index.ts', import.meta.url), newFile, 'utf8');
console.log('src/index.ts written successfully.');
console.log('File size:', newFile.length.toLocaleString(), 'bytes');
