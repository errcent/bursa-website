/**
 * Side-by-side visual comparison: iPad mockup phases vs real app pages.
 * Run: node scripts/compare-device-mockup-vs-real.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".screenshots", "device-mockup-comparison");
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";

const DESIGN_WIDTH = 1024;

const checkpoints = [
  {
    label: "catalog",
    progress: 0.08,
    buildRealPath: () => "/katalog",
    realSelector: ".catalog-section",
    mockPhase: "catalog",
  },
  {
    label: "class",
    progress: 0.38,
    buildRealPath: (slug) => `/kelas/${slug}`,
    realSelector: ".relative.w-full.overflow-hidden.bg-black",
    mockPhase: "class",
  },
  {
    label: "modules",
    progress: 0.62,
    buildRealPath: (slug) => `/kelas/${slug}`,
    realSelector: "section.mb-14",
    mockPhase: "modules",
  },
  {
    label: "lesson",
    progress: 0.92,
    buildRealPath: (slug) => `/belajar/${slug}/l1`,
    realSelector: ".grid.min-h-0.flex-1",
    mockPhase: "lesson",
  },
];

async function scrollMockupToProgress(page, target) {
  const bounds = await page.evaluate(() => {
    const track = document.querySelector(".device-mockup-scroll-track");
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    const trackTop = rect.top + window.scrollY;
    return {
      min: Math.max(0, trackTop - 16),
      max: trackTop + track.offsetHeight - window.innerHeight + 16,
    };
  });
  if (!bounds) throw new Error("Mockup scroll track missing");

  let low = bounds.min;
  let high = bounds.max;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const mid = (low + high) / 2;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), mid);
    await page.waitForTimeout(120);
    const current = Number(
      (await page.locator(".device-mockup-scroll-track").getAttribute("data-scroll-progress")) ?? "0",
    );
    if (Math.abs(current - target) < 0.015) return;
    if (current < target) low = mid;
    else high = mid;
  }
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.addInitScript(() => {
  sessionStorage.setItem("bursa-intro-seen", "1");
});

await page.goto(`${baseUrl}/#belajar-dimana-saja`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector(".device-mockup-scroll-track", { state: "visible", timeout: 30000 });

const courseSlug = await page.locator("#belajar-dimana-saja").getAttribute("data-course-slug");
if (!courseSlug) throw new Error("Demo course slug missing from device mockup section");

const results = [];

for (const checkpoint of checkpoints) {
  await page.goto(`${baseUrl}/#belajar-dimana-saja`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".device-mockup-scroll-track", { state: "visible", timeout: 30000 });
  await scrollMockupToProgress(page, checkpoint.progress);
  await page.waitForTimeout(700);

  const mockPath = path.join(outDir, `${checkpoint.label}-mockup.png`);
  const mockPhase = page.locator(`[data-device-phase="${checkpoint.mockPhase}"]`);
  await mockPhase.screenshot({ path: mockPath });

  const realPage = await browser.newPage({ viewport: { width: DESIGN_WIDTH, height: 900 } });
  await realPage.addInitScript(() => {
    sessionStorage.setItem("bursa-intro-seen", "1");
  });

  const realPath = checkpoint.buildRealPath(courseSlug);
  await realPage.goto(`${baseUrl}${realPath}`, { waitUntil: "networkidle", timeout: 60000 });
  await realPage.waitForTimeout(900);

  const realScreenshot = path.join(outDir, `${checkpoint.label}-real.png`);
  const realTarget = realPage.locator(checkpoint.realSelector).first();
  await realTarget.screenshot({ path: realScreenshot });

  const mockBox = await mockPhase.boundingBox();
  const realBox = await realTarget.boundingBox();

  results.push({
    label: checkpoint.label,
    progress: checkpoint.progress,
    realUrl: `${baseUrl}${realPath}`,
    mockScreenshot: mockPath,
    realScreenshot,
    mockSize: mockBox
      ? { width: Math.round(mockBox.width), height: Math.round(mockBox.height) }
      : null,
    realSize: realBox
      ? { width: Math.round(realBox.width), height: Math.round(realBox.height) }
      : null,
    note: "Visual match % — compare mockup vs real PNGs manually or with image diff tooling",
  });

  await realPage.close();
}

await writeFile(path.join(outDir, "comparison.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

await browser.close();
