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
  { name: "mobile", width: 390, height: 844 },
];

const pages = [
  { id: "hub", path: "/lab", label: "Lab Hub" },
  { id: "position-size", path: "/lab/position-size", label: "Position Size" },
  { id: "monte-carlo", path: "/lab/monte-carlo", label: "Monte Carlo" },
  { id: "trade-expectancy", path: "/lab/trade-expectancy", label: "Trade Expectancy" },
];

const redirectChecks = [
  { from: "/lab/backtester", expectPath: "/lab" },
  { from: "/lab/portfolio-var", expectPath: "/lab" },
  { from: "/lab/volatility", expectPath: "/lab" },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = { capturedAt: new Date().toISOString(), baseUrl, pages: [], redirects: [] };

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
        const toolRows = document.querySelectorAll(".lab-tool-row").length;
        const pills = document.querySelectorAll(".lab-pill").length;
        const heroCinematic = document.querySelectorAll("main .hero-cinematic").length;
        const headings = [...document.querySelectorAll("h1")].slice(0, 3).map((el) => ({
          text: el.textContent?.trim().slice(0, 80) ?? "",
        }));

        const scrollWidth = main?.scrollWidth ?? document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;

        return {
          horizontalOverflow: scrollWidth > clientWidth + 2,
          toolRowCount: toolRows,
          filterPillCount: pills,
          heroCinematicInMain: heroCinematic,
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

const redirectContext = await browser.newContext();
const redirectPage = await redirectContext.newPage();
for (const check of redirectChecks) {
  try {
    const response = await redirectPage.goto(`${baseUrl}${check.from}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const finalPath = new URL(redirectPage.url()).pathname;
    report.redirects.push({
      ...check,
      status: response?.status() ?? null,
      finalPath,
      ok: finalPath === check.expectPath,
    });
  } catch (error) {
    report.redirects.push({ ...check, ok: false, error: String(error) });
  }
}
await redirectContext.close();

await browser.close();

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(`Lab QA complete → ${outDir}`);
