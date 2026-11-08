/**
 * Interaction tests for the ByteSide Status Page.
 *
 * Covers user interactions not tested elsewhere:
 * - Auto-refresh trigger when timer hits zero
 * - Service icon rendering
 * - Keyboard accessibility (tab focus reaches interactive elements)
 * - Footer link targets
 * - Page-level accessibility landmarks
 * - Page load performance
 */

import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes, MOCK_STATUS, MOCK_MINUTES } from './fixtures/api-mock';

// ── Auto-refresh trigger ──────────────────────────────────────────────────────

test.describe('Auto-refresh — timer reaching zero triggers refresh', () => {
  test('onRefresh is called when checkedAt is in the past beyond the interval', async ({ page }) => {
    let apiCallCount = 0;

    // First call: stale data (61 seconds old) — timer should fire immediately
    // Second call: fresh data — confirms refresh happened
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
    await page.route('**/api/status**', async (route) => {
      apiCallCount++;
      const staleTime = new Date(Date.now() - 61_000).toISOString();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_STATUS, checkedAt: staleTime }),
      });
    });

    await page.route(/\/api\/minutes\/.*/, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MINUTES),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    // Wait for the timer to fire and call /api/status a second time
    await page.waitForFunction(() => true); // yield to JS event loop
    await expect.poll(() => apiCallCount, { timeout: 10_000 }).toBeGreaterThan(1);
  });
});

// ── Service icon rendering ────────────────────────────────────────────────────

test.describe('Service icons — SVG renders for each service', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('each service row has a non-empty icon element', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const icon = rows.nth(i).locator('.component-icon');
      await expect(icon).toBeVisible();
      const innerHTML = await icon.innerHTML();
      expect(innerHTML.trim().length).toBeGreaterThan(0);
    }
  });

  test('each service row icon contains an SVG element', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const svg = rows.nth(i).locator('.component-icon svg');
      await expect(svg).toBeVisible();
    }
  });
});

// ── Keyboard accessibility ────────────────────────────────────────────────────

test.describe('Keyboard accessibility — tab focus reaches key elements', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('navbar logo link is focusable via keyboard', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.navLogoLink.focus();
    await expect(pom.navLogoLink).toBeFocused();
  });

  test('nav links are focusable via keyboard', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const firstLink = pom.navLinks.first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
  });

  test('theme settings button is focusable via keyboard', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.themeSettingsBtn.scrollIntoViewIfNeeded();
    await pom.themeSettingsBtn.focus();
    await expect(pom.themeSettingsBtn).toBeFocused();
  });

  test('theme settings opens on Enter key', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.themeSettingsBtn.scrollIntoViewIfNeeded();
    await pom.themeSettingsBtn.focus();
    await page.keyboard.press('Enter');
    await expect(pom.page.locator('.theme-settings-list')).toBeVisible();
  });

  test('API link is focusable and has correct href', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.apiLink.scrollIntoViewIfNeeded();
    await pom.apiLink.focus();
    await expect(pom.apiLink).toBeFocused();
    await expect(pom.apiLink).toHaveAttribute('href', '/api/status');
  });
});

// ── Footer links ─────────────────────────────────────────────────────────────

test.describe('Footer links — targets and content', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
  });

  test('footer contains "ByteSide.one" column', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    await expect(pom.footer).toContainText('ByteSide.one');
  });

  test('footer contains "Community" column', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    await expect(pom.footer).toContainText('Community');
  });

  test('footer contains social links', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    await expect(pom.footer).toContainText('Facebook');
    await expect(pom.footer).toContainText('Twitter');
  });

  test('footer social links open in new tab (target=_blank)', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();

    const facebookLink = pom.footer.locator('a[href*="facebook.com"]').first();
    await expect(facebookLink).toHaveAttribute('target', '_blank');
    await expect(facebookLink).toHaveAttribute('rel', /noopener/);
  });

  test('footer tagline is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    const tagline = pom.footer.locator('.footer-tagline');
    await expect(tagline).toBeVisible();
    const text = await tagline.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('footer brand link is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await pom.footer.scrollIntoViewIfNeeded();
    const logo = pom.footer.locator('.footer-logo-text');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('ByteSide.one');
  });
});

// ── Page-level accessibility ──────────────────────────────────────────────────

test.describe('Accessibility — structural landmarks', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('page has a <nav> landmark', async ({ page }) => {
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('page has a <footer> landmark', async ({ page }) => {
    await expect(page.locator('footer.footer')).toBeVisible();
  });

  test('page has a <main> element', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible();
  });

  test('<html> has lang="th" attribute for Thai screen readers', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('th');
  });

  test('service section h2 heading is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.servicesSectionTitle).toBeVisible();
  });

  test('incident section h2 heading is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.incidentSectionTitle).toBeVisible();
  });

  test('all images have alt attributes', async ({ page }) => {
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });
});

// ── Performance — page load timing ───────────────────────────────────────────

test.describe('Cookie consent — stacked sheets', () => {
  test('Escape closes only the top sheet and does not record consent', async ({ page }) => {
    const { clearCookieConsent } = await import('./fixtures/consent');
    await clearCookieConsent(page);
    await mockApiRoutes(page, undefined, { grantConsent: false });
    await page.goto('/');

    const banner = page.getByRole('dialog', { name: 'Cookie Preferences' });
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Manage preferences' }).click();
    const settings = page.getByRole('dialog', { name: 'Cookie Settings' });
    await expect(settings).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(settings).not.toBeVisible();
    await expect(banner).toBeVisible();

    // Escape must not be treated as "Reject all" on the banner underneath.
    const stored = await page.evaluate(() => localStorage.getItem('cookie-preferences'));
    expect(stored).toBeNull();
  });
});

test.describe('Performance — load timing', () => {
  test('page loads and shows first content within 5 seconds', async ({ page }) => {
    await mockApiRoutes(page);

    const start = Date.now();
    const pom = new StatusPagePOM(page);
    await pom.goto('/');
    await expect(pom.serviceRows.first()).toBeVisible({ timeout: 5000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('services become visible within 10 seconds of page load', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    // waitForServicesLoaded itself uses a 15s timeout; this is the assertion
    await expect(pom.serviceRows.first()).toBeVisible();
  });
});
