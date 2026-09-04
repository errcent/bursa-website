import { expect, test } from "@playwright/test";

import { AUDIT_ROUTES } from "./routes";

const hasAuth = Boolean(
  process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD
);

// SSOT: learner gated routes; mentor gated routes handled separately when mentor credentials exist
const GATED = AUDIT_ROUTES.filter((r) => r.role === "learner" && r.gated).map((r) => r.path) as readonly string[];

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
