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

  test('navbar contains ByteSide logo link', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navLogoLink).toBeVisible();
    await expect(pom.navLogoLink).toHaveAttribute('href', 'https://beta.byteside.one');
  });

  test('navbar has ByteSide category links', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    await expect(pom.navLinks).toHaveCount(5);
    await expect(pom.navLinks.first()).toHaveText('เกมมิ่ง');
  });

  test('navbar matches beta.byteside.one chrome styles', async ({ page }) => {
    const pom = new StatusPagePOM(page);
    const styles = await page.evaluate(() => {
      const nav = document.querySelector('nav.navbar');
      const topInner = document.querySelector('.nav-top-inner');
      const bottom = document.querySelector('.nav-bottom');
      const top = document.querySelector('.nav-top');
      const logoImg = document.querySelector('.nav-logo-img') as HTMLImageElement | null;
      const link = document.querySelector('.nav-link') as HTMLElement | null;
      const brandPill = document.querySelector('.nav-brand-pill') as HTMLElement | null;

      const cs = (el: Element | null) => (el ? getComputedStyle(el) : null);

      const navCs = cs(nav);
      const topCs = cs(top);
      const bottomCs = cs(bottom);
      const topInnerCs = cs(topInner);
      const linkCs = cs(link);
      const pillCs = cs(brandPill);
      const logoCs = cs(logoImg);

      return {
        navBg: navCs?.backgroundColor,
        topBorder: topCs?.borderBottom,
        bottomBg: bottomCs?.backgroundColor,
        topInnerHeight: topInnerCs?.height,
        topInnerMaxWidth: topInnerCs?.maxWidth,
        topInnerPadding: topInnerCs?.padding,
        logoHeight: logoCs?.height,
        linkFontSize: linkCs?.fontSize,
        linkFontWeight: linkCs?.fontWeight,
        linkLetterSpacing: linkCs?.letterSpacing,
        linkColor: linkCs?.color,
        linkPadding: linkCs?.padding,
        pillHeight: pillCs?.height,
        pillBg: pillCs?.backgroundColor,
        pillBorder: pillCs?.border,
        pillRadius: pillCs?.borderRadius,
      };
    });

    expect(styles.navBg).toBe('rgb(82, 0, 106)');
    expect(styles.topBorder).toBe('1px solid rgba(255, 255, 255, 0.12)');
    expect(styles.bottomBg).toBe('rgba(0, 0, 0, 0.15)');
    expect(styles.topInnerHeight).toBe('52px');
    expect(styles.topInnerMaxWidth).toBe('1280px');
    expect(styles.topInnerPadding).toBe('0px 24px');
    expect(styles.logoHeight).toBe('32px');
    expect(styles.linkFontSize).toBe('14px');
    expect(styles.linkFontWeight).toBe('500');
    expect(styles.linkLetterSpacing).toBe('0.2px');
    expect(styles.linkColor).toBe('rgba(255, 255, 255, 0.78)');
    expect(styles.linkPadding).toBe('9.6px 17.6px');
    expect(styles.pillHeight).toBe('36px');
    expect(styles.pillBg).toBe('rgba(255, 255, 255, 0.12)');
    expect(styles.pillBorder).toBe('1px solid rgba(255, 255, 255, 0.2)');
    expect(styles.pillRadius).toBe('18px');

    await expect(pom.navLinks.nth(0)).toHaveAttribute('href', 'https://beta.byteside.one/tags/gaming');
    await expect(pom.navLinks.nth(1)).toHaveAttribute('href', 'https://beta.byteside.one/tags/tech');
    await expect(page.getByRole('tablist', { name: 'เลือกแบรนด์' })).toBeVisible();
  });
});

test.describe('Status Page — hero banner', () => {
  test('shows loading state initially (before API resolves)', async ({ page }) => {
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
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
    const { grantCookieConsent } = await import('./fixtures/consent');
    await grantCookieConsent(page);
    await page.route('**/api/status**', (route) => route.abort('failed'));

    const pom = new StatusPagePOM(page);
    await pom.goto();
    // Wait for fetch to fail and component to re-render
    await expect(pom.heroTitle).toHaveText('ไม่สามารถโหลดสถานะได้', { timeout: 10000 });
  });
});
