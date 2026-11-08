import { test, expect } from '@playwright/test';
import { StatusPagePOM } from './pages/StatusPage';
import { mockApiRoutes, MOCK_STATUS } from './fixtures/api-mock';

test.describe('Status Page — service list', () => {
  test('sagelga fast current-only fetch is requested before brand-full then all-full on mount', async ({ page }) => {
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
    const requestOrder: string[] = [];

    await page.route('**/api/status**', async (route) => {
      const url = route.request().url();
      requestOrder.push(url);
      const parsed = new URL(url);
      const brand = parsed.searchParams.get('brand');
      const currentOnly = parsed.searchParams.get('currentOnly') === 'true';
      const delay = currentOnly && brand === 'sagelga' ? 150 : 0;
      await new Promise((r) => setTimeout(r, delay));
      const { MOCK_STATUS_SAGELGA, MOCK_STATUS_FULL } = await import('./fixtures/api-mock');
      const body = currentOnly && brand === 'sagelga'
        ? { ...MOCK_STATUS_SAGELGA, history: {} }
        : brand === 'sagelga'
        ? MOCK_STATUS_SAGELGA
        : MOCK_STATUS_FULL;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto('/?brand=sagelga');
    await pom.waitForServicesLoaded();

    const isAllFullRequest = (url: string) => {
      const params = new URL(url).searchParams;
      return !params.has('brand') && !params.has('currentOnly');
    };
    // all-full is deferred to requestIdleCallback (up to 5s), so wait for it.
    await expect
      .poll(() => requestOrder.some(isAllFullRequest), { timeout: 8000 })
      .toBe(true);

    const currentIdx = requestOrder.findIndex((u) => {
      const p = new URL(u).searchParams;
      return p.get('brand') === 'sagelga' && p.get('currentOnly') === 'true';
    });
    const brandFullIdx = requestOrder.findIndex((u) => {
      const p = new URL(u).searchParams;
      return p.get('brand') === 'sagelga' && !p.has('currentOnly');
    });
    const allFullIdx = requestOrder.findIndex((u) => {
      const p = new URL(u).searchParams;
      return !p.has('brand') && !p.has('currentOnly');
    });

    expect(currentIdx).toBeGreaterThanOrEqual(0);
    expect(brandFullIdx).toBeGreaterThan(currentIdx);
    expect(allFullIdx).toBeGreaterThan(brandFullIdx);
  });

  test('brand toggle click shows sagelga badges from currentOnly before delayed brand-full', async ({ page }) => {
    const { grantCookieConsent } = await import('./fixtures/consent');
    const { MOCK_STATUS_BYTESIDE, MOCK_STATUS_SAGELGA, MOCK_STATUS_FULL } = await import('./fixtures/api-mock');
    await grantCookieConsent(page);

    await page.route('**/api/status**', async (route) => {
      const url = new URL(route.request().url());
      const brand = url.searchParams.get('brand');
      const currentOnly = url.searchParams.get('currentOnly') === 'true';
      let delay = 0;
      // Long enough that the loading badge is observable after the tab click.
      if (currentOnly && brand === 'sagelga') delay = 2000;
      else if (brand === 'sagelga') delay = 2000;
      else if (currentOnly && brand === 'byteside') delay = 100;
      else delay = 500;
      await new Promise((r) => setTimeout(r, delay));

      const body = currentOnly && brand === 'sagelga'
        ? { ...MOCK_STATUS_SAGELGA, history: {} }
        : currentOnly && brand === 'byteside'
        ? { ...MOCK_STATUS_BYTESIDE, history: {} }
        : brand === 'sagelga'
        ? MOCK_STATUS_SAGELGA
        : brand === 'byteside'
        ? MOCK_STATUS_BYTESIDE
        : MOCK_STATUS_FULL;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto('/');
    await pom.waitForServicesLoaded();

    await page.getByRole('tab', { name: 'sagelga.com' }).click();
    await expect(pom.serviceRows).toHaveCount(7);
    await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();

    const sagelgaRow = pom.serviceRows.filter({ has: page.locator('.component-name', { hasText: 'sagelga.com' }) });
    await expect(sagelgaRow.locator('.badge.operational')).toBeVisible({ timeout: 4000 });
    await expect(sagelgaRow.locator('.badge')).not.toHaveClass(/loading/);
  });

  test('sagelga brand shows badges from fast current fetch before full history arrives', async ({ page }) => {
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);

    // Hold each phase until the test has observed the state it produces.
    let releaseCurrent!: () => void;
    const currentGate = new Promise<void>((resolve) => { releaseCurrent = resolve; });
    let releaseFull!: () => void;
    const fullGate = new Promise<void>((resolve) => { releaseFull = resolve; });

    await page.route('**/api/status**', async (route) => {
      const url = new URL(route.request().url());
      const brand = url.searchParams.get('brand');
      const currentOnly = url.searchParams.get('currentOnly') === 'true';

      if (brand === 'sagelga') {
        await (currentOnly ? currentGate : fullGate);
      } else {
        await new Promise((r) => setTimeout(r, 2500));
      }

      const { MOCK_STATUS_SAGELGA, MOCK_STATUS_FULL } = await import('./fixtures/api-mock');
      const body = currentOnly && brand === 'sagelga'
        ? { ...MOCK_STATUS_SAGELGA, history: {} }
        : brand === 'sagelga'
        ? MOCK_STATUS_SAGELGA
        : MOCK_STATUS_FULL;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    const pom = new StatusPagePOM(page);
    await pom.goto('/?brand=sagelga');

    await expect(pom.serviceRows).toHaveCount(7, { timeout: 5000 });
    await expect(pom.serviceRows.locator('.component-name', { hasText: 'sagelga.com' })).toBeVisible();
    await expect(pom.serviceRows.first().locator('.badge.loading')).toBeVisible();

    releaseCurrent();
    await expect(pom.serviceRows.first().locator('.badge.operational')).toBeVisible({ timeout: 4000 });
    await expect(pom.serviceRows.first().locator('.uptime-bar.loading').first()).toBeVisible();

    releaseFull();
    await pom.waitForServicesLoaded();
    await expect(pom.serviceRows.first().locator('.uptime-bar.operational').first()).toBeVisible();
    await expect(pom.serviceRows).toHaveCount(7);
  });

  test('service names appear immediately while API is pending', async ({ page }) => {
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
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

  test('brand toggle switches to the thaipatmetal frontend service', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await page.getByRole('tab', { name: 'ไทยพัฒน์เมทัล' }).click();

    await expect(pom.serviceRows).toHaveCount(1);
    await expect(pom.serviceRows.locator('.component-name')).toHaveText(['เว็บไซต์หลัก']);

    await expect(pom.serviceRows.locator('.badge.operational')).toHaveCount(1, { timeout: 5000 });
    await expect(pom.serviceRows.first().locator('.uptime-bar.operational').first()).toBeVisible();
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

  test('every service row shows a 30-day uptime percentage', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const rows = pom.serviceRows;
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const pct = rows.nth(i).locator('.uptime-pct b');
      await expect(pct).toBeVisible();
      await expect(pct).toHaveText(/^\d+\.\d{2}%$/);
    }
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
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
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

    // Today's bar must agree with the live badge, even though the mock says 100%.
    await expect(pom.serviceRows.nth(1).locator('.uptime-bars')).toHaveClass(/bars-loaded/);
    const todayBar = pom.serviceRows.nth(1).locator('.uptime-bar').last();
    await expect(todayBar).toHaveClass(/degraded/);
    await expect(todayBar).not.toHaveClass(/status-loaded/);
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
