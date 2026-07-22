/** Deep resource breakdown for a single URL. */
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://bursanalar.vercel.app/";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const items: { url: string; type: string; kb: number }[] = [];

  page.on("response", async (r) => {
    try {
      const body = await r.body();
      items.push({
        url: r.url().slice(0, 120),
        type: r.request().resourceType(),
        kb: Math.round(body.byteLength / 1024),
      });
    } catch {
      /* skip */
    }
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1000);
  await browser.close();

  items.sort((a, b) => b.kb - a.kb);
  console.log(`Top resources for ${url}\n`);
  for (const i of items.slice(0, 25)) {
    console.log(`${i.kb} KB\t[${i.type}]\t${i.url}`);
  }
  console.log(`\nTotal: ${items.length} requests, ${Math.round(items.reduce((s, i) => s + i.kb, 0))} KB`);
}

void main();
