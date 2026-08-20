import { expect, test } from "@playwright/test";

const hasAuth = Boolean(
  process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD
);

const GATED = ["/dashboard", "/profil", "/pengaturan"] as const;

test.describe("Authenticated gated pages (QC-20260811-49)", () => {
  test.skip(!hasAuth, "Butuh PLAYWRIGHT_AUTH_EMAIL dan PLAYWRIGHT_AUTH_PASSWORD");

  for (const pathName of GATED) {
    test(`${pathName} bukan login wall`, async ({ page }) => {
      await page.goto(pathName, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/masuk/);
      await expect(page.locator("#identifier")).toHaveCount(0);
    });
  }
});
