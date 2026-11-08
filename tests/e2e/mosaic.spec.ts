import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes } from './fixtures/api-mock';

test.describe('Status Page — inline mosaic panel (hover)', () => {
  test('hovering a bar opens the inline mosaic panel', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const firstBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await firstBar.hover();

    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
  });

  test('moving mouse off the row hides the inline mosaic panel', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const firstBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await firstBar.hover();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    // Trigger the onMouseLeave on the uptime-row by moving to a neutral position
    await pom.aboutBlurb.hover();
    await expect(pom.mosaicInlinePanel).not.toBeVisible({ timeout: 5000 });
  });

  test('inline panel shows a date label on hover', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const firstBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await firstBar.hover();

    await expect(pom.mosaicInlineDate).toBeVisible({ timeout: 5000 });
  });

  test('inline panel mosaic grid has 1440 cells total (720 AM + 720 PM)', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const firstBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await firstBar.hover();

    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
    const cells = pom.mosaicInlinePanel.locator('.mosaic-cell');
    await expect(cells).toHaveCount(1440, { timeout: 8000 });
  });
});

test.describe('Mosaic inline panel — click-to-lock', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('clicking a bar opens the inline mosaic panel', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await lastBar.click();

    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
  });

  test('inline panel shows a date label after bar click', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await lastBar.click();

    await expect(pom.mosaicInlineDate).toBeVisible({ timeout: 5000 });
    const text = await pom.mosaicInlineDate.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('inline panel renders 720 cells in the AM block', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await lastBar.click();

    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
    const amCells = pom.mosaicBlockAM.locator('.mosaic-cell');
    await expect(amCells).toHaveCount(720, { timeout: 8000 });
  });

  test('inline panel renders 720 cells in the PM block', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await lastBar.click();

    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
    const pmCells = pom.mosaicBlockPM.locator('.mosaic-cell');
    await expect(pmCells).toHaveCount(720, { timeout: 8000 });
  });

  test('AM block has label "AM"', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    const amLabel = pom.mosaicBlockAM.locator('.mosaic-block-label');
    await expect(amLabel).toHaveText('00:00 – 11:59');
  });

  test('PM block has label "12:00 – 23:59"', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    const pmLabel = pom.mosaicBlockPM.locator('.mosaic-block-label');
    await expect(pmLabel).toHaveText('12:00 – 23:59');
  });

  test('clicking the same locked bar a second time closes the panel', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();

    // First click: lock open
    await lastBar.click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    // Second click on the same bar: unlock / close
    await lastBar.click();
    await expect(pom.mosaicInlinePanel).not.toBeVisible({ timeout: 5000 });
  });

  test('clicking a different service bar closes the first panel and opens a new one', async ({ page }) => {
    const pom = new StatusPagePOM(page);

    // Open panel for first service
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    // Open panel for second service — should replace, not stack
    await pom.serviceRows.nth(1).locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toHaveCount(1);
  });

  test('uptime percentage is shown when data is available', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    // Wait for the async minute fetch to resolve (mocked instantly)
    await expect(pom.mosaicInlinePct).toBeVisible({ timeout: 8000 });
    const pctText = await pom.mosaicInlinePct.textContent();
    // Should contain a percentage or "ไม่มีข้อมูล"
    expect(pctText).toMatch(/%|ไม่มีข้อมูล|—/);
  });

  test('selected bar gets the "selected" CSS class', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const lastBar = pom.serviceRows.first().locator('.uptime-bar').last();
    await lastBar.click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });
    await expect(lastBar).toHaveClass(/selected/);
  });

  test('non-selected bars get dimmed when a bar is locked', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    // The uptime-bars container should have the has-selection modifier
    const barsContainer = pom.serviceRows.first().locator('.uptime-bars');
    await expect(barsContainer).toHaveClass(/has-selection/);
  });

  test('mosaic axis labels are present (00, 15, 30, 45)', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.serviceRows.first().locator('.uptime-bar').last().click();
    await expect(pom.mosaicInlinePanel).toBeVisible({ timeout: 5000 });

    const axis = pom.mosaicBlockAM.locator('.mosaic-axis');
    await expect(axis).toBeVisible();
    await expect(axis).toContainText('15m');
    await expect(axis).toContainText('30m');
    await expect(axis).toContainText('45m');
    await expect(axis).toContainText('60m');
  });
});
