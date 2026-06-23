import { Page } from '@playwright/test';
import { SERVICES_BY_BRAND, BrandId } from '../../../src/config';
import { StatusResponse } from '../../../src/types';
import { grantCookieConsent } from './consent';

function buildMockForBrand(brand: BrandId): StatusResponse {
  const services = SERVICES_BY_BRAND[brand].map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    status: 'operational' as const,
    responseTime: 200,
    statusCode: 200,
  }));
  const history = Object.fromEntries(
    services.map((s) => [s.id, new Array(30).fill('operational')]),
  );
  return {
    status: 'operational',
    checkedAt: new Date(Date.now() - 10_000).toISOString(),
    services,
    history,
  };
}

export const MOCK_STATUS_BYTESIDE = buildMockForBrand('byteside');
export const MOCK_STATUS_SAGELGA = buildMockForBrand('sagelga');

export const MOCK_STATUS: StatusResponse = {
  ...MOCK_STATUS_BYTESIDE,
  services: [
    ...MOCK_STATUS_BYTESIDE.services.map((s, i) =>
      i === 2 ? { ...s, name: 'โฮสต์สำหรับรูปภาพและวิดีโอ' } : s,
    ),
  ],
};

export const MOCK_STATUS_FULL: StatusResponse = {
  status: 'operational',
  checkedAt: new Date(Date.now() - 10_000).toISOString(),
  services: [...MOCK_STATUS_BYTESIDE.services, ...MOCK_STATUS_SAGELGA.services],
  history: {
    ...MOCK_STATUS_BYTESIDE.history,
    ...MOCK_STATUS_SAGELGA.history,
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
  ...new Array(480).fill('operational'),
  ...new Array(60).fill('nodata'),
  ...new Array(900).fill('operational'),
];

function resolveStatusBody(url: string, statusOverride?: StatusResponse): string {
  const parsed = new URL(url);
  const brand = parsed.searchParams.get('brand') as BrandId | null;
  if (statusOverride) return JSON.stringify(statusOverride);
  if (brand === 'sagelga') return JSON.stringify(MOCK_STATUS_SAGELGA);
  if (brand === 'byteside') return JSON.stringify(MOCK_STATUS_BYTESIDE);
  return JSON.stringify(MOCK_STATUS_FULL);
}

/**
 * Intercepts /api/status and /api/minutes/* with deterministic mock data so
 * tests are fully offline and never flaky due to external service availability.
 */
export async function mockApiRoutes(
  page: Page,
  statusOverride?: StatusResponse,
  options?: { grantConsent?: boolean },
) {
  if (options?.grantConsent !== false) {
    await grantCookieConsent(page);
  }

  await page.route('**/api/status**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: resolveStatusBody(route.request().url(), statusOverride),
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