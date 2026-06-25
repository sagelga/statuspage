import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './fixtures/api-mock';
import { clearCookieConsent, forceLightTheme } from './fixtures/consent';

type RgbTriplet = [number, number, number];

function parseRgb(color: string): RgbTriplet | null {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]: RgbTriplet): number {
  const linearize = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [r, g, b].map(linearize);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

test.describe('Cookie consent banner — contrast on light page theme', () => {
  test.beforeEach(async ({ page }) => {
    await forceLightTheme(page);
    await clearCookieConsent(page);
    await mockApiRoutes(page, undefined, { grantConsent: false });
  });

  test('banner links use light accent colors on the dark bottom sheet', async ({ page }) => {
    await page.goto('/');

    const sheet = page.locator('.bottom-sheet');
    const privacyLink = page.locator('.cookie-banner-link', { hasText: 'Privacy Policy' });
    const acceptButton = page.locator('.cookie-btn-accept');

    await expect(sheet).toBeVisible({ timeout: 10_000 });
    await expect(privacyLink).toBeVisible();

    const linkColor = await privacyLink.evaluate((el) => getComputedStyle(el).color);
    const sheetBg = await sheet.evaluate((el) => getComputedStyle(el).backgroundColor);
    const acceptBg = await acceptButton.evaluate((el) => getComputedStyle(el).backgroundColor);
    const acceptColor = await acceptButton.evaluate((el) => getComputedStyle(el).color);
    const accentHoverVar = await sheet.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--color-accent-hover').trim(),
    );

    const linkRgb = parseRgb(linkColor);
    const sheetRgb = parseRgb(sheetBg);
    expect(linkRgb).not.toBeNull();
    expect(sheetRgb).not.toBeNull();

    const linkLightness = relativeLuminance(linkRgb!);
    const sheetLightness = relativeLuminance(sheetRgb!);

    expect(accentHoverVar).toBe('#e0c3ff');
    expect(linkLightness).toBeGreaterThan(0.6);
    expect(sheetLightness).toBeLessThan(0.1);
    expect(acceptBg).toBe('rgb(124, 58, 237)');
    expect(acceptColor).toBe('rgb(255, 255, 255)');
  });
});