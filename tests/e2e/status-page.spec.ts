import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes, MOCK_STATUS } from './fixtures/api-mock';

test.describe('Status Page — page load', () => {
  test('page title is correct', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await expect(page).toHaveTitle(/สถานะระบบ/);
  });

  test('page loads without JS errors', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    expect(jsErrors).toHaveLength(0);
  });

  test('page returns HTTP 200', async ({ page }) => {
    await mockApiRoutes(page);
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Status Page — navbar', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await new StatusPagePOM(page).goto();
  });

  test('navbar is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navbar).toBeVisible();
  });

  test('navbar contains logo link', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navLogoLink).toBeVisible();
    await expect(pom.navLogoLink).toHaveAttribute('href', /byteside\.one/);
  });

  test('navbar has 5 navigation links', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navLinks).toHaveCount(5);
  });
});

test.describe('Status Page — hero banner', () => {
  test('shows loading state initially (before API resolves)', async ({ page }) => {
    // Delay the API response so we can assert on the loading state
    await page.route('**/api/status**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATUS),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto();

    // Service names render immediately; status badges and bars show loading placeholders
    await expect(pom.serviceRows).toHaveCount(5);
    await expect(pom.serviceRows.first().locator('.component-name')).not.toBeEmpty();
    await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();
    await expect(pom.serviceRows.first().locator('.uptime-bar.loading').first()).toBeVisible();
  });

  test('hides hero banner when all services are operational', async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForStatusLoaded();

    await expect(pom.heroBanner).toHaveCount(0);
    const badges = pom.serviceRows.locator('.badge.operational');
    await expect(badges).toHaveCount(5);
  });

  test('shows degraded banner when a service is slow', async ({ page }) => {
    const degraded = {
      ...MOCK_STATUS,
      status: 'degraded' as const,
      services: MOCK_STATUS.services.map((s, i) =>
        i === 0 ? { ...s, status: 'degraded' as const } : s,
      ),
    };
    await mockApiRoutes(page, degraded);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForStatusLoaded();

    await expect(pom.heroBanner).toHaveClass(/degraded/);
  });

  test('shows down banner when a service is down', async ({ page }) => {
    const down = {
      ...MOCK_STATUS,
      status: 'down' as const,
      services: MOCK_STATUS.services.map((s, i) =>
        i === 0 ? { ...s, status: 'down' as const, responseTime: null, statusCode: null } : s,
      ),
    };
    await mockApiRoutes(page, down);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForStatusLoaded();

    await expect(pom.heroBanner).toHaveClass(/down/);
  });

  test('shows error banner when API call fails', async ({ page }) => {
    await page.route('**/api/status**', (route) => route.abort('failed'));

    const pom = new StatusPagePOM(page);
    await pom.goto();
    // Wait for fetch to fail and component to re-render
    await expect(pom.heroTitle).toHaveText('ไม่สามารถโหลดสถานะได้', { timeout: 10000 });
  });
});

test.describe('Status Page — service list', () => {
  test('service names appear immediately while API is pending', async ({ page }) => {
    await page.route('**/api/status**', async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATUS),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto();

    await expect(pom.serviceRows).toHaveCount(5, { timeout: 5000 });
    await expect(pom.serviceRows.first().locator('.component-name')).not.toBeEmpty();
    await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();
    await expect(pom.serviceRows.first().locator('.uptime-bar.loading').first()).toBeVisible();
  });

  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('section title reads "บริการ"', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.servicesSectionTitle).toHaveText('บริการ');
  });

  test('renders all 5 service rows', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.serviceRows).toHaveCount(5);
  });

  test('every service row shows a name', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const name = rows.nth(i).locator('.component-name');
      await expect(name).not.toBeEmpty();
    }
  });

  test('every service row shows a status badge', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('.badge')).toBeVisible();
    }
  });

  test('all services show "ใช้งานได้" badge for operational status', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const badges = pom.serviceRows.locator('.badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveText('ใช้งานได้');
    }
  });

  test('every service row shows response time', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const rt = rows.nth(i).locator('.response-time');
      await expect(rt).toBeVisible();
      const text = await rt.textContent();
      // Should contain "ms" or "—"
      expect(text).toMatch(/ms|—/);
    }
  });

  test('each service row has 30 uptime bars', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const bars = pom.serviceRows.first().locator('.uptime-bar');
    await expect(bars).toHaveCount(30);
  });

  test('uptime legend is visible with all four states', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.uptimeLegend).toBeVisible();
    // Legend labels come from ServiceList JSX (static strings, not StatusLabels map)
    await expect(pom.uptimeLegend).toContainText('ทำงานปกติ');
    await expect(pom.uptimeLegend).toContainText('ล่าช้า');
    await expect(pom.uptimeLegend).toContainText('ล่ม');
    await expect(pom.uptimeLegend).toContainText('ไม่มีข้อมูล');
  });

  test('loading badges are gone after data loads', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const badges = pom.serviceRows.locator('.badge');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).not.toHaveClass(/loading/);
    }
  });

  test('degraded service shows "มีปัญหา" badge', async ({ page }) => {
    // Navigate with a fresh mock for this test
    await page.route('**/api/status**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_STATUS,
          status: 'degraded',
          services: MOCK_STATUS.services.map((s, i) =>
            i === 1 ? { ...s, status: 'degraded' } : s,
          ),
        }),
      });
    });
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();

    const degradedBadge = pom.serviceRows.nth(1).locator('.badge.degraded');
    await expect(degradedBadge).toHaveText('มีปัญหา');
  });
});

test.describe('Status Page — refresh timer', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    const pom = new StatusPagePOM(page);
    await pom.goto();
    await pom.waitForServicesLoaded();
  });

  test('refresh timer container is visible', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.refreshTimer).toBeVisible();
  });

  test('refresh timer shows countdown label', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const label = pom.refreshTimer.locator('.refresh-timer-label');
    await expect(label).toHaveText('รีเฟรชใน');
  });

  test('refresh timer value is a countdown number', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const value = pom.refreshTimer.locator('.refresh-timer-value');
    await expect(value).toBeVisible();
    const text = await value.textContent();
    // Should match "NNs", "N:NN", or "..." format
    expect(text).toMatch(/^\d+s$|^\d+:\d{2}$|\.\.\./);
  });

  test('refresh timer SVG progress ring is rendered', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const svg = pom.refreshTimer.locator('svg').first();
    await expect(svg).toBeVisible();
  });
});

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
    // (the hero banner is above the service list)
    await pom.heroBanner.hover();
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

  test('theme toggle button is present', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.themeToggleBtn).toBeVisible();
  });

  test('clicking theme toggle switches theme class on html element', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const initialClass = await pom.getThemeClass();
    await pom.clickThemeToggle();
    const newClass = await pom.getThemeClass();
    expect(newClass).not.toBe(initialClass);
  });
});
