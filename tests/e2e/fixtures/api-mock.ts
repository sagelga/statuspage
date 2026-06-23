import { Page } from '@playwright/test';
import { StatusResponse } from '../../../src/types';

/**
 * Canonical mock response used across tests.
 * Using a fixed timestamp far in the past prevents the RefreshTimer from
 * triggering a window.location.reload() mid-test.
 */
export const MOCK_STATUS: StatusResponse = {
  status: 'operational',
  checkedAt: new Date(Date.now() - 10_000).toISOString(), // 10 s ago — timer won't fire
  services: [
    { id: 'cloudflare',  name: 'เครือข่าย Cloudflare',              icon: 'shield',     status: 'operational', responseTime: 120, statusCode: 200 },
    { id: 'website',     name: 'เว็บไซต์',                           icon: 'globe',      status: 'operational', responseTime: 350, statusCode: 200 },
    { id: 'r2-content',  name: 'โฮสต์สำหรับรูปภาพและวิดีโอ',          icon: 'image',      status: 'operational', responseTime: 210, statusCode: 200 },
    { id: 'notion-sync', name: 'ระบบดึงข้อมูลจาก Notion',             icon: 'refresh-cw', status: 'operational', responseTime: 480, statusCode: 200 },
    { id: 'notion',      name: 'ฐานข้อมูล Notion',                   icon: 'database',   status: 'operational', responseTime: 300, statusCode: 200 },
  ],
  history: {
    cloudflare:  new Array(30).fill('operational'),
    website:     new Array(30).fill('operational'),
    'r2-content':  new Array(30).fill('operational'),
    'notion-sync': new Array(30).fill('operational'),
    notion:      new Array(30).fill('operational'),
  },
};

export const MOCK_STATUS_DEGRADED: StatusResponse = {
  ...MOCK_STATUS,
  status: 'degraded',
  services: MOCK_STATUS.services.map((s, i) =>
    i === 1 ? { ...s, status: 'degraded', responseTime: 2000 } : s,
  ),
};

export const MOCK_STATUS_DOWN: StatusResponse = {
  ...MOCK_STATUS,
  status: 'down',
  services: MOCK_STATUS.services.map((s, i) =>
    i === 1 ? { ...s, status: 'down', responseTime: null, statusCode: null } : s,
  ),
};

export const MOCK_MINUTES: ('operational' | 'nodata')[] = [
  ...new Array(480).fill('operational'),  // midnight–08:00
  ...new Array(60).fill('nodata'),        // 08:00–09:00 gap
  ...new Array(900).fill('operational'),  // rest of day
];

/**
 * Intercepts /api/status and /api/minutes/* with deterministic mock data so
 * tests are fully offline and never flaky due to external service availability.
 */
export async function mockApiRoutes(page: Page, statusOverride?: StatusResponse) {
  const statusBody = JSON.stringify(statusOverride ?? MOCK_STATUS);

  await page.route('**/api/status**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: statusBody,
    });
  });

  await page.route(/\/api\/minutes\/.*/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MINUTES),
    });
  });
}
