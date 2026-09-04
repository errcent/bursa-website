import { chromium } from "playwright";

const BASE = process.argv[2]?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";
const ROUTES = ["/", "/katalog", "/lab", "/privasi/kebijakan", "/kepercayaan/keamanan", "/pengaturan", "/kelas/fundamental-saham-untuk-pemula"];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const path of ROUTES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const responses: any[] = [];
    page.on("response", (r) => responses.push(r));
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
    const status = res?.status() ?? 0;
    await page.waitForTimeout(800);
    let jsBytes = 0, totalBytes = 0;
    for (const r of responses) {
      try {
        const body = await r.body();
        totalBytes += body.byteLength;
        if (r.request().resourceType() === "script") jsBytes += body.byteLength;
      } catch {}
    }
    console.log(`${path} | status ${status} | js ${Math.round(jsBytes/1024)}KB | total ${Math.round(totalBytes/1024)}KB | req ${responses.length}`);
    await context.close();
  }
  await browser.close();
}
void main();
