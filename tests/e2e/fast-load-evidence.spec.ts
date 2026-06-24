/**
 * Verification harness: fast current-only path shows badges before full history.
 * Run: CI=true npx playwright test tests/e2e/fast-load-evidence.spec.ts
 */
import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { MOCK_STATUS_BYTESIDE, MOCK_STATUS_FULL } from './fixtures/api-mock';

test('badges become non-loading from currentOnly before full fetch completes', async ({ page }) => {
  const { grantCookieConsent } = await import('./fixtures/consent');
  await grantCookieConsent(page);

  const requestLog: { url: string; at: number }[] = [];
  const t0 = Date.now();

  await page.route('**/api/status**', async (route) => {
    const url = route.request().url();
    const parsed = new URL(url);
    const currentOnly = parsed.searchParams.get('currentOnly') === 'true';
    const delay = currentOnly ? 200 : 3000;
    await new Promise((r) => setTimeout(r, delay));
    const body = currentOnly
      ? { ...MOCK_STATUS_BYTESIDE, history: {} }
      : MOCK_STATUS_FULL;
    requestLog.push({ url, at: Date.now() - t0 });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  const pom = new StatusPagePOM(page);
  await pom.goto('/');

  await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();

  const badgeVisibleAt = Date.now();
  await expect(pom.serviceRows.first().locator('.badge.operational')).toBeVisible({ timeout: 2000 });
  const badgeElapsed = Date.now() - badgeVisibleAt;

  const badgeText = await pom.serviceRows.first().locator('.badge').textContent();
  expect(badgeText).toContain('ใช้งานได้');
  expect(badgeElapsed).toBeLessThan(1500);

  const currentReq = requestLog.find((r) => r.url.includes('currentOnly=true'));
  expect(currentReq).toBeDefined();

  await expect.poll(() => requestLog.filter((r) => !new URL(r.url).searchParams.has('currentOnly')).length).toBeGreaterThan(0, { timeout: 5000 });
  const fullReq = requestLog.find((r) => !new URL(r.url).searchParams.has('currentOnly'));
  expect(fullReq).toBeDefined();
  expect(currentReq!.at).toBeLessThan(fullReq!.at);
  expect(badgeElapsed).toBeLessThan(fullReq!.at);
});