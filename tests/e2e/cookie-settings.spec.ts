import { test, expect, type Page } from "@playwright/test";
import { COOKIE_STORAGE_KEY } from "../../src/types";
import { mockApiRoutes } from "./fixtures/api-mock";
import { clearCookieConsent, forceLightTheme } from "./fixtures/consent";

type StoredPreferences = {
  functional: boolean;
  analytics: boolean;
  consentGiven: boolean;
  consentTimestamp: number | null;
};

async function readPreferences(page: Page): Promise<StoredPreferences | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredPreferences) : null;
  }, COOKIE_STORAGE_KEY);
}

test.describe("Cookie preferences sheet", () => {
  test.beforeEach(async ({ page }) => {
    await forceLightTheme(page);
    await clearCookieConsent(page);
    await mockApiRoutes(page, undefined, { grantConsent: false });
  });

  test("opens from the banner and saves an analytics opt-in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Manage preferences" }).click();

    const dialog = page.getByRole("dialog", { name: "ตั้งค่าคุกกี้" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "คุกกี้ที่จำเป็น" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("switch", { name: "คุกกี้ที่จำเป็น เปิดเสมอ" }),
    ).toHaveAttribute("aria-checked", "true");

    const analyticsSwitch = dialog.getByRole("switch", {
      name: "คุกกี้วิเคราะห์",
    });
    await expect(analyticsSwitch).toHaveAttribute("aria-checked", "false");

    await analyticsSwitch.click();
    await expect(analyticsSwitch).toHaveAttribute("aria-checked", "true");

    await dialog.getByRole("button", { name: "บันทึกการเลือก" }).click();
    await expect(dialog).toBeHidden();

    const prefs = await readPreferences(page);
    expect(prefs).toMatchObject({
      functional: true,
      analytics: true,
      consentGiven: true,
    });
    expect(prefs?.consentTimestamp).toEqual(expect.any(Number));
  });

  test("essential-only persists a rejection and reopens with the saved state", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Manage preferences" }).click();

    const dialog = page.getByRole("dialog", { name: "ตั้งค่าคุกกี้" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "ใช้เท่าที่จำเป็น" }).click();
    await expect(dialog).toBeHidden();

    const prefs = await readPreferences(page);
    expect(prefs).toMatchObject({ analytics: false, consentGiven: true });

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("switch", { name: "คุกกี้วิเคราะห์" }),
    ).toHaveAttribute("aria-checked", "false");
    await expect(
      dialog.getByText("บันทึกความยินยอมล่าสุด"),
    ).toBeVisible();
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("sheet fits the viewport and actions remain reachable", async ({
      page,
    }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Manage preferences" }).click();

      const dialog = page.getByRole("dialog", { name: "ตั้งค่าคุกกี้" });
      await expect(dialog).toBeVisible();

      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390 + 1);
      await expect(
        dialog.getByRole("button", { name: "บันทึกการเลือก" }),
      ).toBeVisible();
    });
  });
});

test.describe("Cookie preferences sheet — dark theme", () => {
  test.use({ colorScheme: "dark" });

  test.beforeEach(async ({ page }) => {
    await clearCookieConsent(page);
    await mockApiRoutes(page, undefined, { grantConsent: false });
    await page.addInitScript(() => {
      document.documentElement.classList.remove("light-theme");
      document.documentElement.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme-preference", "dark");
    });
  });

  test("uses the dark page palette and accent", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Manage preferences" }).click();

    const dialog = page.getByRole("dialog", { name: "ตั้งค่าคุกกี้" });
    await expect(dialog).toBeVisible();

    const sheetBg = await dialog.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const saveBg = await dialog
      .getByRole("button", { name: "บันทึกการเลือก" })
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(sheetBg).toBe("rgb(19, 13, 28)");
    expect(saveBg).toBe("rgb(167, 139, 250)");
  });
});
