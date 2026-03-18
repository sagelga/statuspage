import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the main status page.
 *
 * Encapsulates all locator strategies and interaction helpers so tests stay
 * readable and changes to markup only need updating here.
 */
export class StatusPagePOM {
  readonly page: Page;

  // ── Layout ──────────────────────────────────────────────────────────────────

  readonly navbar: Locator;
  readonly navLogoLink: Locator;
  readonly navLinks: Locator;
  readonly footer: Locator;
  readonly themeToggleBtn: Locator;

  // ── Hero banner ─────────────────────────────────────────────────────────────

  readonly heroBanner: Locator;
  readonly heroTitle: Locator;
  readonly heroSub: Locator;

  // ── Service list ────────────────────────────────────────────────────────────

  readonly servicesSection: Locator;
  readonly servicesSectionTitle: Locator;
  readonly componentsCard: Locator;
  readonly serviceRows: Locator;
  readonly skeletonRows: Locator;
  readonly uptimeBars: Locator;
  readonly uptimeLegend: Locator;
  readonly refreshTimer: Locator;
  readonly minutePopup: Locator;

  // ── Mosaic inline panel ─────────────────────────────────────────────────────

  readonly mosaicInlinePanel: Locator;
  readonly mosaicInlineDate: Locator;
  readonly mosaicInlinePct: Locator;
  readonly mosaicBlockAM: Locator;
  readonly mosaicBlockPM: Locator;

  // ── Incident history ────────────────────────────────────────────────────────

  readonly incidentSection: Locator;
  readonly incidentSectionTitle: Locator;
  readonly incidentCard: Locator;
  readonly noIncidentsTitle: Locator;

  // ── API section ─────────────────────────────────────────────────────────────

  readonly apiSection: Locator;
  readonly apiLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Layout
    this.navbar         = page.locator('nav.navbar');
    this.navLogoLink    = page.locator('a.nav-logo');
    this.navLinks       = page.locator('ul.nav-list a.nav-link');
    this.footer         = page.locator('footer.footer');
    this.themeToggleBtn = page.locator('button.footer-toggle-btn');

    // Hero
    this.heroBanner = page.locator('.hero-banner');
    this.heroTitle  = page.locator('.hero-title');
    this.heroSub    = page.locator('.hero-sub');

    // Service list
    this.servicesSection      = page.locator('.section').filter({ has: page.locator('h2:has-text("บริการ")') });
    this.servicesSectionTitle = this.servicesSection.locator('.section-title');
    this.componentsCard       = page.locator('#components');
    this.serviceRows          = page.locator('.component-row');
    this.skeletonRows         = page.locator('.skeleton-row');
    this.uptimeBars           = page.locator('.uptime-bars');
    this.uptimeLegend         = page.locator('.uptime-legend');
    this.refreshTimer         = page.locator('.refresh-timer-container');
    this.minutePopup          = page.locator('#minute-popup');

    // Mosaic inline panel
    this.mosaicInlinePanel = page.locator('.mosaic-inline-panel');
    this.mosaicInlineDate  = page.locator('.mosaic-inline-date');
    this.mosaicInlinePct   = page.locator('.mosaic-inline-pct');
    this.mosaicBlockAM     = page.locator('.mosaic-block').nth(0);
    this.mosaicBlockPM     = page.locator('.mosaic-block').nth(1);

    // Incident history
    this.incidentSection      = page.locator('.section').filter({ has: page.locator('h2:has-text("ประวัติเหตุการณ์")') });
    this.incidentSectionTitle = this.incidentSection.locator('.section-title');
    this.incidentCard         = page.locator('#incidents');
    this.noIncidentsTitle     = page.locator('.no-incidents-title');

    // API section
    this.apiSection = page.locator('.section').filter({ has: page.locator('h2:has-text("JSON API")') });
    this.apiLink    = page.locator('.api-card a[href="/api/status"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  /** Wait until the skeleton loader has been replaced by real service rows. */
  async waitForServicesLoaded() {
    await expect(this.skeletonRows.first()).not.toBeVisible({ timeout: 15000 });
    await expect(this.serviceRows.first()).toBeVisible({ timeout: 15000 });
  }

  /** Wait until the hero banner has a concrete status (not 'loading'). */
  async waitForStatusLoaded() {
    await expect(this.heroBanner).not.toHaveClass(/loading/, { timeout: 15000 });
  }

  async clickThemeToggle() {
    await this.themeToggleBtn.click();
  }

  async getThemeClass(): Promise<string> {
    const cls = await this.page.locator('html').getAttribute('class') ?? '';
    return cls;
  }
}
