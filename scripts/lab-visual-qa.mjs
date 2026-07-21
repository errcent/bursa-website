/**
 * Lab UI/UX visual capture + lightweight metrics.
 * Run: node scripts/lab-visual-qa.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../.qa/lab");
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const pages = [
  { id: "hub", path: "/lab", label: "Lab Hub" },
  { id: "position-size", path: "/lab/position-size", label: "Position Size" },
  { id: "monte-carlo", path: "/lab/monte-carlo", label: "Monte Carlo" },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = { capturedAt: new Date().toISOString(), baseUrl, pages: [] };

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    sessionStorage.setItem("bursa-intro-seen", "1");
  });

  for (const target of pages) {
    const url = `${baseUrl}${target.path}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(800);

      const fileName = `${target.id}-${vp.name}.png`;
      const filePath = join(outDir, fileName);
      await page.screenshot({ path: filePath, fullPage: true });

      const metrics = await page.evaluate(() => {
        const main = document.querySelector("main");
        const cards = document.querySelectorAll(".surface-card, .surface-card-hover");
        const headings = [...document.querySelectorAll("h1, h2")].slice(0, 8).map((el) => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 60) ?? "",
          fontSize: getComputedStyle(el).fontSize,
        }));

        const scrollWidth = main?.scrollWidth ?? document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const horizontalOverflow = scrollWidth > clientWidth + 2;

        const categoryBanners = [...document.querySelectorAll("[class*='bg-gradient-to-r']")].length;
        const pillCount = document.querySelectorAll("button.rounded-full").length;

        return {
          horizontalOverflow,
          scrollWidth,
          clientWidth,
          cardCount: cards.length,
          categoryBannerCount: categoryBanners,
          filterPillCount: pillCount,
          mainSections: document.querySelectorAll("main section").length,
          headings,
        };
      });

      report.pages.push({
        viewport: vp.name,
        ...target,
        screenshot: fileName,
        metrics,
      });
    } catch (error) {
      report.pages.push({
        viewport: vp.name,
        ...target,
        error: String(error),
      });
    }
  }

  await context.close();
}

await browser.close();

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`Lab QA complete → ${outDir}`);
