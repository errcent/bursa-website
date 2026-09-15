import { chromium, devices } from "playwright";

const URL = process.env.AUDIT_URL ?? "http://localhost:3000/belajar/fundamental-saham-untuk-pemula/l1";

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("bursa-intro-seen", "1");
    } catch {
      /* ignore */
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => {
    const videoShell = document.querySelector(".video-player-shell");
    const videoRect = videoShell?.getBoundingClientRect();
    const main = document.querySelector("main");
    const mainRect = main?.getBoundingClientRect();
    const scrim = document.querySelector("[data-lesson-scrim]");
    const scrimStyle = scrim ? getComputedStyle(scrim) : null;
    const placeholder = document.querySelector("[data-lesson-video-slot]");
    const placeholderRect = placeholder?.getBoundingClientRect();
    const introPending = document.documentElement.classList.contains("intro-pending");

    return {
      videoTop: videoRect?.top ?? null,
      videoLeft: videoRect?.left ?? null,
      videoWidth: videoRect?.width ?? null,
      videoHeight: videoRect?.height ?? null,
      mainTop: mainRect?.top ?? null,
      placeholderHeight: placeholderRect?.height ?? null,
      scrimPresent: Boolean(scrim),
      scrimBg: scrimStyle?.backgroundColor ?? null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      introPending,
    };
  });

  await page.mouse.move(195, 120);
  await page.mouse.down();
  await page.mouse.move(195, 280, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  const afterSwipe = await page.evaluate(() => {
    const scrim = document.querySelector("[data-lesson-scrim]");
    const scrimStyle = scrim ? getComputedStyle(scrim) : null;
    const placeholder = document.querySelector("[data-lesson-video-slot]");
    return {
      scrimPresent: Boolean(scrim),
      scrimBg: scrimStyle?.backgroundColor ?? null,
      placeholderHeight: placeholder?.getBoundingClientRect().height ?? null,
    };
  });

  const issues = [];
  if (metrics.videoTop > 4) issues.push(`video not flush top (${metrics.videoTop}px)`);
  if (metrics.scrimPresent) issues.push("scrim mounted at rest");
  if (metrics.introPending) issues.push("intro-pending still on (skewed metrics)");

  console.log(JSON.stringify({ url: URL, metrics, afterSwipe, issues, errors }, null, 2));
  await browser.close();
  if (issues.length) process.exitCode = 2;
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
