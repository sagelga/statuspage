import { Page, Locator, expect } from '@playwright/test';
import { grantCookieConsent } from '../fixtures/consent';

/**
 * Page Object Model for the main status page.
 */
export class StatusPagePOM {
  readonly page: Page;

  readonly navbar: Locator;
  readonly navLogoLink: Locator;
  readonly navLinks: Locator;
  readonly footer: Locator;
  readonly themeSettingsBtn: Locator;

  readonly heroBanner: Locator;
  readonly heroTitle: Locator;
  readonly heroSub: Locator;
  readonly heroRefresh: Locator;
  readonly aboutBlurb: Locator;

  readonly servicesSection: Locator;
  readonly servicesSectionTitle: Locator;
  readonly componentsCard: Locator;
  readonly serviceRows: Locator;
  readonly skeletonRows: Locator;
  readonly uptimeBars: Locator;
  readonly uptimePct: Locator;
  readonly componentUrl: Locator;
  readonly uptimeLegend: Locator;
  readonly loadErrorPanel: Locator;
  readonly loadErrorRetry: Locator;
  readonly refreshTimer: Locator;
  readonly minutePopup: Locator;

  readonly mosaicInlinePanel: Locator;
  readonly mosaicInlineDate: Locator;
  readonly mosaicInlinePct: Locator;
  readonly mosaicBlockAM: Locator;
  readonly mosaicBlockPM: Locator;

  readonly incidentSection: Locator;
  readonly incidentSectionTitle: Locator;
  readonly incidentCard: Locator;
  readonly noIncidentsTitle: Locator;

  readonly apiSection: Locator;
  readonly apiLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navbar         = page.locator('nav.navbar');
    this.navLogoLink    = page.locator('a.nav-logo-text, a.nav-logo');
    this.navLinks       = page.locator('ul.nav-list .nav-link');
    this.footer         = page.locator('footer.footer');
    this.themeSettingsBtn = page.locator('button.footer-toggle-btn[aria-label="Theme settings"]');

    this.heroBanner = page.locator('.hero-banner');
    this.heroTitle  = page.locator('.hero-title');
    this.heroSub    = page.locator('.hero-sub');
    this.heroRefresh = page.locator('.hero-refresh');
    this.aboutBlurb = page.locator('.about-blurb');

    this.servicesSection      = page.locator('.section').filter({ has: page.locator('h2:has-text("บริการ")') });
    this.servicesSectionTitle = this.servicesSection.locator('.section-title');
    this.componentsCard       = page.locator('#components');
    this.serviceRows          = page.locator('.component-row');
    this.skeletonRows         = page.locator('.skeleton-row');
    this.uptimeBars           = page.locator('.uptime-bars');
    this.uptimePct            = page.locator('.uptime-pct');
    this.componentUrl         = page.locator('.component-url');
    this.uptimeLegend         = page.locator('.uptime-legend');
    this.loadErrorPanel       = page.locator('.load-error-panel');
    this.loadErrorRetry       = page.locator('.load-error-retry');
    this.refreshTimer         = page.locator('.refresh-timer-container');
    this.minutePopup          = page.locator('#minute-popup');

    this.mosaicInlinePanel = page.locator('.mosaic-inline-panel');
    this.mosaicInlineDate  = page.locator('.mosaic-inline-date');
    this.mosaicInlinePct   = page.locator('.mosaic-inline-pct');
    this.mosaicBlockAM     = page.locator('.mosaic-block').nth(0);
    this.mosaicBlockPM     = page.locator('.mosaic-block').nth(1);

    this.incidentSection      = page.locator('.section').filter({ has: page.locator('h2:has-text("ประวัติเหตุการณ์")') });
    this.incidentSectionTitle = this.incidentSection.locator('.section-title');
    this.incidentCard         = page.locator('#incidents');
    this.noIncidentsTitle     = page.locator('.no-incidents-title');

    this.apiSection = page.locator('.section').filter({ has: page.locator('h2:has-text("JSON API")') });
    this.apiLink    = page.locator('.api-card a[href="/api/status"]');
  }

  async goto(path = '/') {
    await grantCookieConsent(this.page);
    await this.page.goto(path);
    await this.dismissOverlays();
  }

  async dismissOverlays() {
    const accept = this.page.getByRole('button', { name: 'Accept all' });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click();
    }
  }

  async waitForServicesLoaded() {
    await expect(this.serviceRows.first()).toBeVisible({ timeout: 15000 });
    await expect(this.serviceRows.first().locator('.badge')).not.toHaveClass(/loading/, { timeout: 15000 });
  }

  async waitForStatusLoaded() {
    // The hero is always rendered now, so waiting for it to leave the loading
    // state is enough to know the current-status phase has resolved.
    await expect(this.heroBanner).toBeVisible({ timeout: 15000 });
    await expect(this.heroBanner).not.toHaveClass(/loading/, { timeout: 15000 });
    await expect(this.heroBanner).not.toHaveClass(/error/, { timeout: 15000 });
  }

  async waitForUptimeLoaded() {
    // dailyUptime arrives with the brand-full payload, after currentOnly badges.
    await expect(this.serviceRows.first().locator('.uptime-pct b')).not.toHaveText('—', { timeout: 15000 });
  }

  async openThemeSettings() {
    await this.themeSettingsBtn.scrollIntoViewIfNeeded();
    await this.themeSettingsBtn.click();
    await expect(this.page.locator('.theme-settings-list')).toBeVisible();
  }

  async selectTheme(label: 'Light' | 'Dark' | 'System') {
    await this.openThemeSettings();
    await this.page.locator('.theme-option').filter({ hasText: label }).click();
  }

  async getDataTheme(): Promise<'light' | 'dark' | null> {
    const attr = await this.page.locator('html').getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return null;
  }
}