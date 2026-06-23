import { Page } from '@playwright/test';
import { COOKIE_STORAGE_KEY } from '../../../src/types';

/** Pre-accept cookies so bottom-sheet overlays do not block UI interactions. */
export async function grantCookieConsent(page: Page) {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      functional: true,
      analytics: true,
      consentGiven: true,
      consentTimestamp: Date.now(),
    }));
  }, COOKIE_STORAGE_KEY);
}