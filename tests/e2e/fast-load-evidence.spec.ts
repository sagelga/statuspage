/**
 * Verification harness: fast current-only path shows badges before full history.
 * Run: CI=true npx playwright test tests/e2e/fast-load-evidence.spec.ts
 */
import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { MOCK_STATUS_BYTESIDE, MOCK_STATUS_SAGELGA } from './fixtures/api-mock';

type Phase = 'byteside-current' | 'byteside-full' | 'sagelga-current' | 'sagelga-full';

function resolvePhase(url: string): Phase {
  const parsed = new URL(url);
  const brand = parsed.searchParams.get('brand');
  const currentOnly = parsed.searchParams.get('currentOnly') === 'true';
  if (currentOnly && brand === 'byteside') return 'byteside-current';
  if (currentOnly && brand === 'sagelga') return 'sagelga-current';
  if (brand === 'byteside') return 'byteside-full';
  return 'sagelga-full';
}

function resolveBody(phase: Phase) {
  switch (phase) {
    case 'byteside-current':
      return { ...MOCK_STATUS_BYTESIDE, history: {}, dailyUptime: undefined, dailyFuncUptime: undefined };
    case 'sagelga-current':
      return { ...MOCK_STATUS_SAGELGA, history: {}, dailyUptime: undefined, dailyFuncUptime: undefined };
    case 'byteside-full':
      return MOCK_STATUS_BYTESIDE;
    default:
      return MOCK_STATUS_SAGELGA;
  }
}

const PHASE_DELAY: Record<Phase, number> = {
  'byteside-current': 200,
  'sagelga-current': 200,
  'byteside-full': 1200,
  'sagelga-full': 1200,
};

function installStatusMock(page: import('@playwright/test').Page) {
  const requested: { phase: Phase; at: number }[] = [];
  const t0 = Date.now();

  page.on('request', (req) => {
    if (req.url().includes('/api/status')) {
      requested.push({ phase: resolvePhase(req.url()), at: Date.now() - t0 });
    }
  });

  page.route('**/api/status**', async (route) => {
    const phase = resolvePhase(route.request().url());
    await new Promise((r) => setTimeout(r, PHASE_DELAY[phase]));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(resolveBody(phase)),
    });
  });

  return requested;
}

test('initial load: badges from currentOnly before brand-full request', async ({ page }) => {
  const { grantCookieConsent } = await import('./fixtures/consent');
  await grantCookieConsent(page);
  const requested = installStatusMock(page);

  const pom = new StatusPagePOM(page);
  await pom.goto('/');

  await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();
  await expect(pom.serviceRows.first().locator('.badge.operational')).toBeVisible({ timeout: 2000 });

  const currentReq = requested.find((r) => r.phase === 'byteside-current');
  expect(currentReq).toBeDefined();

  await expect.poll(() => requested.filter((r) => r.phase === 'byteside-full').length).toBeGreaterThan(0, { timeout: 3000 });
  const brandFullReq = requested.find((r) => r.phase === 'byteside-full');
  expect(brandFullReq).toBeDefined();
  expect(currentReq!.at).toBeLessThan(brandFullReq!.at);
});

test('brand switch via tab: sagelga currentOnly badges before brand-full request', async ({ page }) => {
  const { grantCookieConsent } = await import('./fixtures/consent');
  await grantCookieConsent(page);
  const requested = installStatusMock(page);

  const pom = new StatusPagePOM(page);
  await pom.goto('/');
  await expect(pom.serviceRows.first().locator('.badge.operational')).toBeVisible({ timeout: 3000 });

  const countBeforeSwitch = requested.length;
  await page.getByRole('tab', { name: 'sagelga.com' }).click();

  await expect(pom.serviceRows).toHaveCount(7);
  const sagelgaRow = pom.serviceRows.filter({ has: page.locator('.component-name', { hasText: 'sagelga.com' }) });
  await expect(sagelgaRow.locator('.badge.operational')).toBeVisible({ timeout: 2000 });
  await expect(sagelgaRow.locator('.badge')).not.toHaveClass(/loading/);

  const switchRequests = requested.slice(countBeforeSwitch);
  const sagelgaCurrent = switchRequests.find((r) => r.phase === 'sagelga-current');
  const sagelgaFull = switchRequests.find((r) => r.phase === 'sagelga-full');

  if (sagelgaCurrent) {
    if (sagelgaFull) {
      expect(sagelgaCurrent.at).toBeLessThan(sagelgaFull.at);
    }
  } else {
    expect(sagelgaFull).toBeUndefined();
  }

  expect(requested.some((r) => !r.phase.includes('byteside') && !r.phase.includes('sagelga'))).toBe(false);
});