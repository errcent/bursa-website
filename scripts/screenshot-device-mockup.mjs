import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", ".screenshots");
const startFile = path.join(outDir, "device-mockup-scroll-start.png");
const midFile = path.join(outDir, "device-mockup-mid-scroll.png");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto("http://localhost:3000/#belajar-dimana-saja", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1500);

function measureCopyClearance() {
  const nav =
    document.querySelector("[data-hero-nav-shell]") ??
    document.querySelector(".hero-nav-float") ??
    document.querySelector(".nav-shell");
  const eyebrow = document.querySelector(".device-mockup-header .eyebrow-tight");
  const heading = document.querySelector("#device-mockup-heading");
  const body = document.querySelector(".device-mockup-header .section-copy");

  const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
  const copyTop = Math.min(
    eyebrow?.getBoundingClientRect().top ?? Infinity,
    heading?.getBoundingClientRect().top ?? Infinity,
    body?.getBoundingClientRect().top ?? Infinity,
  );

  const isVisible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0;
  };

  return {
    scrollY: window.scrollY,
    navBottom,
    copyTop,
    copyBelowNav: copyTop >= navBottom - 1,
    eyebrowVisible: isVisible(eyebrow),
    headingVisible: isVisible(heading),
    bodyVisible: isVisible(body),
    headerOffset: getComputedStyle(document.documentElement)
      .getPropertyValue("--site-header-offset")
      .trim(),
    stickyTop: document.querySelector(".device-mockup-sticky")?.getBoundingClientRect().top ?? null,
  };
}

const metrics = await page.evaluate(() => {
  const track = document.querySelector(".device-mockup-scroll-track");
  if (!track) return null;

  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  const trackHeight = track.offsetHeight;
  const viewport = window.innerHeight;

  return {
    trackTop,
    trackHeight,
    scrollStart: Math.max(0, trackTop - 8),
    midScroll: trackTop + trackHeight * 0.45 - viewport * 0.05,
  };
});

if (!metrics) throw new Error("Device mockup scroll track not found");

await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), metrics.scrollStart);
await page.waitForTimeout(1200);

const startMetrics = await page.evaluate(measureCopyClearance);
await page.screenshot({ path: startFile, fullPage: false });

await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), metrics.midScroll);
await page.waitForTimeout(1200);

const midMetrics = await page.evaluate(measureCopyClearance);
await page.screenshot({ path: midFile, fullPage: false });

console.log(
  JSON.stringify(
    {
      metrics,
      start: { ...startMetrics, screenshot: startFile },
      mid: { ...midMetrics, screenshot: midFile },
    },
    null,
    2,
  ),
);

await browser.close();
