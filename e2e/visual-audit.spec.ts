import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { AUDIT_ROUTES } from "./routes";

const SCREENSHOT_ROOT = path.join(__dirname, "screenshots");
const META_ROOT = path.join(__dirname, "reports");
const hasAuth = Boolean(
  process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD,
);

type RouteMeta = {
  path: string;
  slug: string;
  project: string;
  gated?: boolean;
  authenticated: boolean;
  status: number | null;
  finalUrl: string;
  incomplete: boolean;
  pageErrors: string[];
  consoleErrors: string[];
  screenshot: string;
  error?: string;
};

async function settlePage(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.evaluate(() => {
      localStorage.setItem("bursa-cookie-consent", "essential-only");
    });
  } catch {
    /* ignore */
  }
  try {
    await page.waitForLoadState("networkidle", { timeout: 12_000 });
  } catch {
    // Some pages keep long-polling / analytics — continue after timeout.
  }
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    // Scroll through page so lazy/in-view content mounts, then return top.
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(window.innerHeight * 0.85, 400);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

test.describe("Visual audit capture", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("bursa-cookie-consent", "essential-only");
      } catch {
        /* ignore */
      }
      try {
        Object.defineProperty(window, "matchMedia", {
          writable: true,
          value: (query: string) => ({
            matches: query.includes("prefers-reduced-motion"),
            media: query,
            onchange: null,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
          }),
        });
      } catch {
        /* ignore */
      }
    });
  });

  for (const route of AUDIT_ROUTES) {
    test(`capture ${route.path}`, async ({ page }, testInfo) => {
      const project = testInfo.project.name;
      const outDir = path.join(SCREENSHOT_ROOT, project);
      fs.mkdirSync(outDir, { recursive: true });
      fs.mkdirSync(META_ROOT, { recursive: true });

      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => pageErrors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      let status: number | null = null;
      let error: string | undefined;
      let finalUrl = "";

      try {
        const response = await page.goto(route.path, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
        status = response?.status() ?? null;
        await settlePage(page);
        finalUrl = page.url();
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        finalUrl = page.url();
      }

      const screenshotPath = path.join(outDir, `${route.slug}.png`);

      try {
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          animations: "disabled",
        });
      } catch (e) {
        error = [error, e instanceof Error ? e.message : String(e)]
          .filter(Boolean)
          .join(" | ");
      }

      const identifierCount = await page.locator("#identifier").count().catch(() => 0);
      const onLoginWall =
        /\/masuk/.test(finalUrl) || (route.gated === true && identifierCount > 0 && !hasAuth);

      const incomplete = Boolean(route.gated && (!hasAuth || onLoginWall));

      const meta: RouteMeta = {
        path: route.path,
        slug: route.slug,
        project,
        gated: route.gated,
        authenticated: hasAuth,
        status,
        finalUrl,
        incomplete,
        pageErrors: pageErrors.slice(0, 10),
        consoleErrors: consoleErrors.slice(0, 10),
        screenshot: path.relative(path.join(__dirname, ".."), screenshotPath).replace(/\\/g, "/"),
        error,
      };

      const metaPath = path.join(META_ROOT, `meta-${project}-${route.slug}.json`);
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

      // Soft assertions — capture must continue even on soft failures
      if (status !== null) {
        expect.soft(status, `${route.path} HTTP status`).toBeLessThan(500);
      }
      expect.soft(pageErrors, `${route.path} pageerrors`).toEqual([]);
    });
  }
});
