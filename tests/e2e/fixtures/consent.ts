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

/** Ensure the cookie consent banner can appear on first visit. */
export async function clearCookieConsent(page: Page) {
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, COOKIE_STORAGE_KEY);
}

/** Force light page theme so body text stays dark while sheets remain always-dark. */
export async function forceLightTheme(page: Page) {
  await page.addInitScript(() => {
    document.documentElement.classList.add('light-theme');
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.setAttribute('data-theme', 'light');
  });
}