/**
 * Mobile responsiveness tests for the ByteSide Status Page.
 *
 * Validates that the page renders correctly and is fully usable on mobile
 * viewport sizes, matching the Thai tech/gaming audience who frequently
 * visit from mobile when experiencing service issues.
 */

import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes } from './fixtures/api-mock';

// All mobile tests run at iPhone 14 Pro dimensions
const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe('Mobile — page renders correctly at 390px', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('navbar is visible on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navbar).toBeVisible();
  });

  test('hero banner is visible and not clipped on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.heroBanner).toBeVisible();

    // Banner should be fully inside the viewport horizontally
    const box = await pom.heroBanner.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1); // +1 for rounding
  });

  test('service rows are visible and not overflowing on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();
    expect(count).toBe(5);

    // Every row should fit within the viewport width
    for (let i = 0; i < count; i++) {
      const box = await rows.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 2);
    }
  });

  test('uptime bars are visible on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const firstRowBars = pom.serviceRows.first().locator('.uptime-bar');
    await expect(firstRowBars.first()).toBeVisible();
    await expect(firstRowBars).toHaveCount(30);
  });

  test('footer is visible on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    await expect(pom.footer).toBeVisible();
  });

  test('theme toggle button is reachable on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.themeToggleBtn.scrollIntoViewIfNeeded();
    await expect(pom.themeToggleBtn).toBeVisible();
  });

  test('theme can be toggled on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.themeToggleBtn.scrollIntoViewIfNeeded();
    const before = await pom.getThemeClass();
    await pom.clickThemeToggle();
    const after = await pom.getThemeClass();
    expect(after).not.toBe(before);
  });

  test('no horizontal scrollbar appears on mobile', async ({ page }) => {
    // document.body should not be wider than the viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 2);
  });

  test('incident history section is visible on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.incidentCard.scrollIntoViewIfNeeded();
    await expect(pom.incidentCard).toBeVisible();
  });

  test('API section is visible on mobile', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.apiSection.scrollIntoViewIfNeeded();
    await expect(pom.apiSection).toBeVisible();
  });
});

test.describe('Mobile — narrow viewport (375px, iPhone SE)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('page loads without overflow at 375px', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(377);
  });

  test('hero title is legible (min font-size 14px) on narrow viewport', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForStatusLoaded();

    const fontSize = await pom.heroTitle.evaluate(
      (el) => parseFloat(window.getComputedStyle(el).fontSize)
    );
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });
});

test.describe('Mobile — tablet viewport (768px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('page loads and shows all services at tablet width', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
    await expect(pom.serviceRows).toHaveCount(5);
  });
});
