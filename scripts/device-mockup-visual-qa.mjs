/**
 * Visual QA for iPad device mockup composition.
 * Run: npx playwright install chromium && node scripts/device-mockup-visual-qa.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../.qa/device-mockup");
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.addInitScript(() => {
    sessionStorage.setItem("bursa-intro-seen", "1");
  });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

  const composition = page.locator(".device-mockup-composition");
  await page.locator("#belajar-dimana-saja").scrollIntoViewIfNeeded();
  await page.waitForSelector(".device-mockup-scene__frame", { state: "visible", timeout: 30000 });
  await page.waitForTimeout(1200);

  const metrics = await page.evaluate(() => {
    const scene = document.querySelector(".device-mockup-scene-shell");
    const compositionEl = document.querySelector(".device-mockup-composition");
    const sticky = document.querySelector(".device-mockup-sticky");
    const frame = document.querySelector(".device-mockup-scene__frame");
    const ipadScreen = document.querySelector(".device-mockup-scene__ipad-screen");
    const macScreen = document.querySelector(".device-mockup-scene__macbook-screen");
    const phoneScreen = document.querySelector(".device-mockup-scene__iphone-screen");
    const wrapper3d = document.querySelector(".device-mockup-3d-wrapper");

    if (!scene || !compositionEl || !sticky) {
      return { error: "missing elements" };
    }

    const sceneRect = scene.getBoundingClientRect();
    const compositionRect = compositionEl.getBoundingClientRect();
    const stickyRect = sticky.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const sceneCenterX = sceneRect.left + sceneRect.width / 2;
    const viewportCenterX = vw / 2;
    const centerOffsetPx = Math.abs(sceneCenterX - viewportCenterX);

    const sceneCenterY = sceneRect.top + sceneRect.height / 2;
    const viewportCenterY = vh / 2;
    const verticalCenterOffsetPx = Math.abs(sceneCenterY - viewportCenterY);

    const overflow =
      sceneRect.right > vw + 1 ||
      sceneRect.left < -1 ||
      compositionRect.right > vw + 2;

    return {
      sceneWidth: Math.round(sceneRect.width),
      sceneHeight: Math.round(sceneRect.height),
      compositionWidth: Math.round(compositionRect.width),
      centerOffsetPx: Number(centerOffsetPx.toFixed(1)),
      verticalCenterOffsetPx: Number(verticalCenterOffsetPx.toFixed(1)),
      stickyCentered: centerOffsetPx < vw * 0.08,
      verticallyCentered: verticalCenterOffsetPx < vh * 0.12,
      overflow,
      sceneTop: Math.round(sceneRect.top),
      stickyTop: Math.round(stickyRect.top),
      hasSceneFrame: Boolean(frame),
      hasIpadScreen: Boolean(ipadScreen),
      hasMacScreen: Boolean(macScreen),
      hasPhoneScreen: Boolean(phoneScreen),
      has3dWrapper: Boolean(wrapper3d),
    };
  });

  const screenshotPath = join(outDir, `device-mockup-${vp.name}.png`);
  await composition.screenshot({ path: screenshotPath });

  results.push({ viewport: vp.name, metrics, screenshotPath });
  await page.close();
}

await browser.close();

const summary = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  results,
};

writeFileSync(join(outDir, "metrics.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
