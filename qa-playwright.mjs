import { chromium, devices } from "playwright";

const desktopRoutes = [
  "/",
  "/katalog",
  "/waitlist",
  "/bantuan",
  "/tentang-kami",
  "/panduan-belajar",
  "/terms",
  "/kelas/blueprint-manajemen-risiko-trader",
  "/instruktur/arif-kurniawan",
  "/masuk",
  "/daftar",
  "/jadi-mentor",
  "/nonexistent-qa-404-test",
];

const mobileRoutes = ["/", "/katalog", "/kelas/blueprint-manajemen-risiko-trader"];

async function auditRoute(page, path) {
  const consoleLogs = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const response = await page.goto(`https://bursanalar.com${path}`, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForTimeout(2000);

  const bodyText = await page.locator("body").innerText();
  const cookieVisible = await page
    .locator("text=/cookie|Cookie|Setujui|Terima|consent/i")
    .first()
    .isVisible()
    .catch(() => false);

  const mentorLinks = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => ({ href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 80) }))
      .filter((l) => /jadi-mentor|\/lab|wave-lab|\/mentor/i.test(l.href || ""))
  );

  const brokerCtx = bodyText.match(/.{0,60}broker.{0,60}/i)?.[0] || null;

  return {
    path,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    consoleLogs,
    pageErrors,
    cookieVisible,
    mentorLinks,
    brokerCtx,
    hasPraktisi: /praktisi/i.test(bodyText),
    hasBerjenjang: /berjenjang/i.test(bodyText),
    hasPreview: /pratinjau|preview/i.test(bodyText),
    hasStudents1890: /1[.,]?890/.test(bodyText),
    hasRating49: /4[.,]9/.test(bodyText),
    title: await page.title(),
  };
}

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktop.newPage();
const desktopResults = [];
for (const route of desktopRoutes) {
  desktopResults.push(await auditRoute(desktopPage, route));
}

const iphone = devices["iPhone 13"];
const mobile = await browser.newContext({ ...iphone });
const mobilePage = await mobile.newPage();
const mobileResults = [];
for (const route of mobileRoutes) {
  mobileResults.push(await auditRoute(mobilePage, route));
}

await browser.close();
console.log(JSON.stringify({ desktop: desktopResults, mobile: mobileResults }, null, 2));
