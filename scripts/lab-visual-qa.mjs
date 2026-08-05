/**
 * Lab UI/UX visual capture + lightweight metrics.
 * Run: node scripts/lab-visual-qa.mjs
 * Env: QA_BASE_URL (default http://localhost:3000)
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

const toolIds = [
  "position-size",
  "risk-reward",
  "breakeven",
  "kelly-criterion",
  "monte-carlo",
  "trade-expectancy",
  "floating-calculator",
  "pip-value",
  "lot-size",
  "margin-leverage",
  "swap-rollover",
  "commission-slippage",
  "crypto-fee",
  "atr-trailing-stop",
  "fibonacci",
  "r-multiple",
];

const pages = [
  { id: "hub", path: "/lab", label: "Lab Hub", state: "default" },
  { id: "hub-advanced", path: "/lab", label: "Lab Hub Advanced Open", state: "hub-advanced" },
  { id: "hub-filter", path: "/lab", label: "Lab Hub Filter Risiko", state: "hub-filter" },
  { id: "hub-search", path: "/lab", label: "Lab Hub Search Pip", state: "hub-search" },
  ...toolIds.map((id) => ({
    id,
    path: `/lab/${id}`,
    label: id,
    state: "default",
  })),
  {
    id: "floating-calculator-mode-c",
    path: "/lab/floating-calculator",
    label: "Floating Mode C",
    state: "floating-mode-c",
  },
  {
    id: "monte-carlo-results",
    path: "/lab/monte-carlo",
    label: "Monte Carlo Results",
    state: "monte-carlo-wait",
  },
];

const redirectChecks = [
  { from: "/lab/backtester", expectPath: "/lab" },
  { from: "/lab/portfolio-var", expectPath: "/lab" },
  { from: "/lab/volatility", expectPath: "/lab" },
];

function collectMetrics() {
  const main = document.querySelector("main");
  const scrollWidth = main?.scrollWidth ?? document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;

  const clippedTiles = [...document.querySelectorAll(".lab-result-tile")].filter((el) => {
    const value = el.querySelector(".lab-stat-value, .stat-value");
    if (!value) return false;
    return value.scrollWidth > value.clientWidth + 1;
  }).length;

  const nestedScrollContainers = [...document.querySelectorAll("main *")].filter((el) => {
    const style = window.getComputedStyle(el);
    const oy = style.overflowY;
    return (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 4;
  }).length;

  return {
    horizontalOverflow: scrollWidth > clientWidth + 2,
    toolRowCount: document.querySelectorAll(".lab-tool-row").length,
    filterPillCount: document.querySelectorAll(".lab-pill").length,
    heroCinematicInMain: document.querySelectorAll("main .hero-cinematic").length,
    clippedResultTiles: clippedTiles,
    nestedScrollContainers,
    headings: [...document.querySelectorAll("h1")].slice(0, 3).map((el) => ({
      text: el.textContent?.trim().slice(0, 80) ?? "",
    })),
  };
}

async function applyPageState(page, state) {
  if (state === "hub-advanced") {
    await page.locator("details").evaluate((el) => {
      el.open = true;
    });
  } else if (state === "hub-filter") {
    await page.getByRole("button", { name: "Risiko", exact: true }).click();
  } else if (state === "hub-search") {
    await page.getByLabel("Cari tool Lab").fill("pip");
  } else if (state === "floating-mode-c") {
    await page.getByRole("button", { name: "Floating skenario", exact: true }).click();
  } else if (state === "monte-carlo-wait") {
    await page.waitForSelector(".lab-result-tile", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
}

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const report = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  pages: [],
  redirects: [],
  summary: { total: 0, overflowFailures: 0, clippedFailures: 0, errors: 0 },
};

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
    const stateSuffix = target.state && target.state !== "default" ? `-${target.state}` : "";
    const fileName = `${target.id}-${vp.name}${stateSuffix}.png`;

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 25000 }).catch(() => {});
      await applyPageState(page, target.state);
      await page.waitForTimeout(800);

      await page.screenshot({ path: join(outDir, fileName), fullPage: true });
      const metrics = await page.evaluate(collectMetrics);

      report.summary.total += 1;
      if (metrics.horizontalOverflow) report.summary.overflowFailures += 1;
      if (metrics.clippedResultTiles > 0) report.summary.clippedFailures += 1;

      report.pages.push({
        viewport: vp.name,
        ...target,
        screenshot: fileName,
        metrics,
      });
    } catch (error) {
      report.summary.total += 1;
      report.summary.errors += 1;
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
console.log(
  `Summary: ${report.summary.total} captures, overflow=${report.summary.overflowFailures}, clipped=${report.summary.clippedFailures}, errors=${report.summary.errors}`
);
