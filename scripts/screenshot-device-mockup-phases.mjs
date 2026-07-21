/**
 * Capture iPad mockup screen at each scroll phase (5 steps).
 * Run: node scripts/screenshot-device-mockup-phases.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".screenshots", "device-mockup-phases");
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";

const checkpoints = [
  { label: "catalog", progress: 0.09, phase: "catalog" },
  { label: "class", progress: 0.27, phase: "class" },
  { label: "modules", progress: 0.45, phase: "modules" },
  { label: "lesson", progress: 0.66, phase: "lesson" },
  { label: "fullscreen", progress: 0.92, phase: "fullscreen" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.addInitScript(() => {
  sessionStorage.setItem("bursa-intro-seen", "1");
});

await page.goto(`${baseUrl}/#belajar-dimana-saja`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector(".device-mockup-scroll-track", { state: "visible", timeout: 30000 });
await page.locator("#belajar-dimana-saja").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await page.waitForFunction(() =>
  document.querySelector(".device-mockup-scroll-track")?.hasAttribute("data-scroll-progress"),
);

async function readScrollProgress() {
  return Number(
    (await page.locator(".device-mockup-scroll-track").getAttribute("data-scroll-progress")) ?? "0",
  );
}

async function scrollToProgress(target) {
  const bounds = await page.evaluate(() => {
    const track = document.querySelector(".device-mockup-scroll-track");
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    const trackTop = rect.top + window.scrollY;
    const trackHeight = track.offsetHeight;
    return {
      min: Math.max(0, trackTop - 16),
      max: trackTop + trackHeight - window.innerHeight + 16,
    };
  });

  if (!bounds) throw new Error("Device mockup scroll track not found");

  let low = bounds.min;
  let high = bounds.max;

  for (let attempt = 0; attempt < 28; attempt += 1) {
    const mid = (low + high) / 2;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), mid);
    await page.waitForTimeout(150);
    const current = await readScrollProgress();
    if (Math.abs(current - target) < 0.015) return mid;
    if (current < target) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

const results = [];

for (const checkpoint of checkpoints) {
  const scrollY = await scrollToProgress(checkpoint.progress);
  await page.waitForTimeout(900);

  const screenshotPath = path.join(
    outDir,
    `phase-${checkpoint.label}-scroll-${Math.round(checkpoint.progress * 100)}pct.png`,
  );
  const composition = page.locator(".device-mockup-composition");
  await composition.screenshot({ path: screenshotPath });

  const measuredProgress = await readScrollProgress();
  const phaseMetrics = await page.evaluate(() => {
    const phases = [...document.querySelectorAll("[data-device-phase]")].map((el) => ({
      phase: el.getAttribute("data-device-phase"),
      opacity: getComputedStyle(el).opacity,
    }));
    return phases.sort((a, b) => Number(b.opacity) - Number(a.opacity));
  });

  const protectedOverlay = await page.evaluate(() =>
    Boolean(document.querySelector(".device-mockup-composition")?.textContent?.includes("Video disembunyikan")),
  );

  results.push({
    ...checkpoint,
    scrollY: Math.round(scrollY),
    measuredProgress,
    screenshotPath,
    dominantPhase: phaseMetrics[0]?.phase ?? null,
    phaseOpacities: phaseMetrics,
    showsProtectedOverlay: protectedOverlay,
  });
}

await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

await browser.close();
