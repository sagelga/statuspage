import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes } from './fixtures/api-mock';

test.describe('Status Page — incident history', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await new StatusPagePOM(page).goto();
  });

  test('incident history section title is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.incidentSectionTitle).toHaveText('ประวัติเหตุการณ์');
  });

  test('incident card is rendered', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.incidentCard).toBeVisible();
  });

  test('14-day timeline strip is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const timeline = pom.incidentCard.locator('.no-incidents-timeline');
    await expect(timeline).toBeVisible();
    const days = timeline.locator('.no-incidents-day');
    await expect(days).toHaveCount(14);
  });

  test('no-incident message is displayed', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.noIncidentsTitle).toHaveText('ทุกอย่างเรียบร้อยดีตลอด 14 วัน');
  });

  test('section meta shows "14 วันที่ผ่านมา"', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const meta = pom.incidentSection.locator('.section-meta');
    await expect(meta).toHaveText('14 วันที่ผ่านมา');
  });
});

test.describe('Status Page — API section', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await new StatusPagePOM(page).goto();
  });

  test('JSON API section is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.apiSection).toBeVisible();
  });

  test('/api/status link is rendered', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.apiLink).toBeVisible();
    await expect(pom.apiLink).toHaveText('/api/status');
  });
});

test.describe('Status Page — footer', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await new StatusPagePOM(page).goto();
  });

  test('footer is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.footer).toBeVisible();
  });

  test('footer contains copyright text', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const year = new Date().getFullYear();
    await expect(pom.footer).toContainText(`${year}`);
    await expect(pom.footer).toContainText('ByteSide.one');
  });

  test('theme settings button is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.themeSettingsBtn).toBeVisible();
  });

  test('selecting dark theme sets data-theme=dark on html element', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.selectTheme('Dark');
    await expect(pom.page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('Theme toggle — visual state', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await new StatusPagePOM(page).goto();
  });

  test('theme settings button opens modal with Light and Dark options', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.openThemeSettings();
    await expect(pom.page.locator('.theme-option', { hasText: 'Light' })).toBeVisible();
    await expect(pom.page.locator('.theme-option', { hasText: 'Dark' })).toBeVisible();
  });

  test('selecting Dark theme sets data-theme=dark', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.selectTheme('Dark');
    await expect(pom.page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('selecting Light theme sets data-theme=light', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.selectTheme('Dark');
    await pom.selectTheme('Light');
    await expect(pom.page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('data-theme changes when switching between Light and Dark', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.selectTheme('Light');
    const theme1 = await pom.getDataTheme();
    await pom.selectTheme('Dark');
    const theme2 = await pom.getDataTheme();
    expect(theme2).not.toBe(theme1);
  });
});
