import { chromium, devices } from "playwright";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3000";
const BELAJAR = `${BASE}/belajar/fundamental-saham-untuk-pemula/l1`;
const KATALOG = `${BASE}/katalog`;
const HOME = `${BASE}/`;

async function initPage(context) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push({ type: "pageerror", msg: e.message }));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push({ type: "console", msg: msg.text() });
  });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("bursa-intro-seen", "1");
      localStorage.setItem(
        "bursa-cookie-consent",
        JSON.stringify({ essential: true, analytics: false, updatedAt: Date.now() })
      );
    } catch {
      /* ignore */
    }
  });
  return { page, errors };
}

function issue(list, id, severity, detail) {
  list.push({ id, severity, detail });
}

async function auditBelajar(page, findings) {
  await page.goto(BELAJAR, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2800);

  const atRest = await page.evaluate(() => {
    const video = document.querySelector(".video-player-shell");
    const vr = video?.getBoundingClientRect();
    const scrim = document.querySelector("[data-lesson-scrim]");
    const slot = document.querySelector("[data-lesson-video-slot]");
    const tap = document.querySelector(".video-tap-capture");
    const shell = document.querySelector("[data-lesson-video-slot] > div");
    return {
      videoTop: vr?.top ?? null,
      videoHeight: vr?.height ?? null,
      scrimPresent: Boolean(scrim),
      slotHeight: slot?.getBoundingClientRect().height ?? null,
      tapPointerEvents: tap ? getComputedStyle(tap).pointerEvents : null,
      shellPointerEvents: shell ? getComputedStyle(shell).pointerEvents : null,
    };
  });

  if (atRest.videoTop > 6) issue(findings, "B1", "high", `Video not flush top: ${atRest.videoTop}px`);
  if (atRest.scrimPresent) issue(findings, "B2", "high", "Scrim present at rest");
  if (atRest.tapPointerEvents !== "auto" && atRest.tapPointerEvents !== "") {
    issue(findings, "B3", "med", `Tap layer pointer-events: ${atRest.tapPointerEvents}`);
  }

  const box = await page.locator(".video-player-shell").first().boundingBox();
  if (!box) {
    issue(findings, "B4", "high", "Video shell not found");
    return atRest;
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height * 0.35;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 180, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const afterSwipe = await page.evaluate(() => {
    const scrim = document.querySelector("[data-lesson-scrim]");
    const slot = document.querySelector("[data-lesson-video-slot]");
    const fixedShell = [...document.querySelectorAll("div.fixed")].find((el) =>
      el.className.includes("z-50")
    );
    const scrimStyle = scrim ? getComputedStyle(scrim) : null;
    return {
      scrimPresent: Boolean(scrim),
      scrimBg: scrimStyle?.backgroundColor ?? null,
      slotHeight: slot?.getBoundingClientRect().height ?? null,
      miniFixed: Boolean(fixedShell),
      collapseProgress: document.documentElement.style.getPropertyValue("--lesson-collapse") || null,
    };
  });

  if (!afterSwipe.scrimPresent && !afterSwipe.miniFixed && afterSwipe.slotHeight === atRest.slotHeight) {
    issue(
      findings,
      "B5",
      "high",
      `Swipe did not start collapse (slot ${atRest.slotHeight} → ${afterSwipe.slotHeight})`
    );
  }

  return { atRest, afterSwipe };
}

async function auditNav(page, findings) {
  await page.goto(HOME, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);

  const menuBtn = page.getByRole("button", { name: /menu navigasi|tutup menu/i }).first();
  const btnBox = await menuBtn.boundingBox();
  const viewport = page.viewportSize();

  if (btnBox && viewport && btnBox.x + btnBox.width < viewport.width - 8) {
    const rightGap = viewport.width - (btnBox.x + btnBox.width);
    if (rightGap > 20) {
      issue(findings, "N1", "med", `Hamburger not flush right (gap ${Math.round(rightGap)}px)`);
    }
  }

  await menuBtn.click();
  await page.waitForTimeout(400);

  const navState = await page.evaluate(() => {
    const htmlShift = document.documentElement.classList.contains("mobile-nav-shift");
    const panel = document.getElementById("mobile-nav-panel");
    const panelStyle = panel ? getComputedStyle(panel) : null;
    const app = document.querySelector("[data-app-content]");
    const appTransform = app ? getComputedStyle(app).transform : null;
    const navShell = document.querySelector(".nav-shell");
    const navTransform = navShell ? getComputedStyle(navShell).transform : null;
    const panelRect = panel?.getBoundingClientRect();
    return {
      htmlShift,
      panelVisible: panelStyle?.visibility !== "hidden" && panelRect && panelRect.x < window.innerWidth - 4,
      panelX: panelRect?.x ?? null,
      panelWidth: panelRect?.width ?? null,
      appTransform,
      navTransform,
      duplicateClose: document.querySelectorAll("#mobile-nav-panel button[aria-label='Tutup menu']").length,
      duplicateMenuTitle: document.querySelectorAll("#mobile-nav-panel .font-heading").length,
    };
  });

  if (!navState.htmlShift) issue(findings, "N2", "high", "Page did not shift (mobile-nav-shift missing)");
  if (!navState.panelVisible) issue(findings, "N3", "high", "Nav panel not visible on screen");
  if (navState.appTransform === "none" || navState.appTransform === "matrix(1, 0, 0, 1, 0, 0)") {
    issue(findings, "N4", "high", `No translate on [data-app-content]: ${navState.appTransform}`);
  }
  if (navState.panelX != null && navState.panelX > navState.panelWidth * 0.15) {
    issue(findings, "N6", "high", `Panel shifted with content (panelX=${navState.panelX})`);
  }
  if (navState.duplicateClose > 1) {
    issue(findings, "N5", "low", `Multiple close buttons: ${navState.duplicateClose}`);
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

async function auditKatalog(page, findings) {
  await page.goto(KATALOG, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);

  const carousel = await page.evaluate(() => {
    const scroll = document.querySelector(".catalog-row-scroll");
    if (!scroll) return { found: false };
    const sr = scroll.getBoundingClientRect();
    const last = scroll.lastElementChild;
    const lr = last?.getBoundingClientRect();
    const parent = scroll.closest(".catalog-row-bleed");
    const pr = parent?.getBoundingClientRect();
    const cs = getComputedStyle(scroll);
    return {
      found: true,
      scrollRight: sr.right,
      viewportWidth: window.innerWidth,
      lastChildRight: lr?.right ?? null,
      bleedRight: pr?.right ?? null,
      paddingEnd: cs.paddingInlineEnd,
      marginEnd: parent ? getComputedStyle(parent).marginInlineEnd : null,
      clipRight: pr && pr.right < window.innerWidth - 2,
    };
  });

  if (!carousel.found) {
    issue(findings, "K1", "med", "No mobile catalog-row-scroll found");
    return carousel;
  }
  if (carousel.paddingEnd && carousel.paddingEnd !== "0px") {
    issue(findings, "K2", "med", `Carousel padding-inline-end: ${carousel.paddingEnd}`);
  }
  if (carousel.bleedRight && carousel.bleedRight < carousel.viewportWidth - 1) {
    issue(
      findings,
      "K3",
      "high",
      `Carousel bleed clipped on right (bleed right ${carousel.bleedRight} vs vw ${carousel.viewportWidth})`
    );
  }

  const titleSize = await page.evaluate(() => {
    const t = document.querySelector(".catalog-row-title");
    if (!t) return null;
    const fs = getComputedStyle(t).fontSize;
    return fs;
  });
  if (titleSize && parseFloat(titleSize) < 15) {
    issue(findings, "K4", "low", `Catalog row title small: ${titleSize}`);
  }

  return carousel;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["iPhone 13"] });
  const findings = [];
  let belajar = null;
  let katalog = null;
  let navErrors = [];

  try {
    const { page: belajarPage, errors: belajarErrors } = await initPage(context);
    belajar = await auditBelajar(belajarPage, findings);
    navErrors = belajarErrors;
    await belajarPage.close();

    const { page: navPage, errors: ne } = await initPage(context);
    navErrors.push(...ne);
    await auditNav(navPage, findings);
    await navPage.close();

    const { page: katPage, errors: ke } = await initPage(context);
    navErrors.push(...ke);
    katalog = await auditKatalog(katPage, findings);
    await katPage.close();
  } finally {
    await browser.close();
  }

  const report = {
    base: BASE,
    findings,
    counts: {
      high: findings.filter((f) => f.severity === "high").length,
      med: findings.filter((f) => f.severity === "med").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    belajar,
    katalog,
    errors: navErrors.slice(0, 10),
  };

  console.log(JSON.stringify(report, null, 2));
  if (findings.some((f) => f.severity === "high")) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
