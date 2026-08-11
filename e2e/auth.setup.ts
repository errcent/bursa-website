import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.PLAYWRIGHT_AUTH_EMAIL;
  const password = process.env.PLAYWRIGHT_AUTH_PASSWORD;

  if (!email || !password) {
    setup.skip(true, "PLAYWRIGHT_AUTH_EMAIL / PLAYWRIGHT_AUTH_PASSWORD not set");
    return;
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/masuk", { waitUntil: "domcontentloaded" });
  await page.locator("#identifier").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#identifier").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL((url) => !url.pathname.includes("/masuk"), { timeout: 45_000 });
  await expect(page).not.toHaveURL(/\/masuk/);

  await page.context().storageState({ path: authFile });
});
