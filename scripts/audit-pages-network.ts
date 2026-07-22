/**
 * Audit public routes: HTTP status + network weight (requests, transferred, resources).
 * Usage: npx tsx scripts/audit-pages-network.ts [baseUrl]
 */
import { chromium, type Response } from "playwright";

const BASE = process.argv[2]?.replace(/\/$/, "") ?? "https://bursanalar.vercel.app";

const STATIC_ROUTES = [
  "/",
  "/katalog",
  "/katalog?view=instruktur",
  "/panduan-belajar",
  "/playlist",
  "/lab",
  "/lab/position-size",
  "/waitlist",
  "/tentang-kami",
  "/bantuan",
  "/jadi-mentor",
  "/masuk",
  "/daftar",
  "/dashboard",
  "/profil",
  "/pengaturan",
  "/artikel",
  "/komunitas",
  "/wave-lab",
  "/privasi",
  "/kepercayaan",
  "/syarat-dan-ketentuan",
  "/login",
];

const SAMPLE_DYNAMIC = [
  "/kelas/fundamental-saham-untuk-pemula",
  "/instruktur/andra-wicaksono",
  "/playlist/kesehatan-mental-trading",
  "/checkout/fundamental-saham-untuk-pemula",
  "/belajar/fundamental-saham-untuk-pemula/l1",
];

const ALL_ROUTES = [...STATIC_ROUTES, ...SAMPLE_DYNAMIC];

type Row = {
  path: string;
  ok: boolean;
  status: number;
  requests: number;
  transferredKb: number;
  resourceKb: number;
  topTypes: string;
  slowestMs: number;
  error?: string;
};

function kb(n: number) {
  return Math.round(n / 1024);
}


async function main() {
  console.log(`Auditing ${ALL_ROUTES.length} routes on ${BASE}\n`);
  const rows: Row[] = [];

  const browser = await chromium.launch({ headless: true });

  for (const path of ALL_ROUTES) {
    process.stdout.write(`→ ${path} ... `);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    const page = await context.newPage();
    const responses: Response[] = [];
    page.on("response", (r) => responses.push(r));

    let status = 0;
    let error: string | undefined;

    try {
      const res = await page.goto(`${BASE}${path}`, {
        waitUntil: "networkidle",
        timeout: 45_000,
      });
      status = res?.status() ?? 0;
      await page.waitForTimeout(600);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    let transferred = 0;
    let resourceSize = 0;
    const byType: Record<string, number> = {};
    let slowest = 0;

    for (const r of responses) {
      try {
        const req = r.request();
        const timing = req.timing();
        if (timing) slowest = Math.max(slowest, timing.responseEnd);
      } catch {
        /* ignore */
      }

      const headers = r.headers();
      const cl = headers["content-length"];
      const size = cl ? Number(cl) : 0;
      transferred += size;

      const type = r.request().resourceType();
      byType[type] = (byType[type] ?? 0) + 1;

      try {
        const body = await r.body();
        resourceSize += body.byteLength;
      } catch {
        /* opaque */
      }
    }

    await context.close();

    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t, c]) => `${t}:${c}`)
      .join(", ");

    const row: Row = {
      path,
      ok: status >= 200 && status < 400 && !error,
      status,
      requests: responses.length,
      transferredKb: kb(transferred),
      resourceKb: kb(resourceSize),
      topTypes,
      slowestMs: Math.round(slowest),
      error,
    };
    rows.push(row);
    console.log(row.ok ? `OK ${row.status}` : `FAIL ${row.status} ${row.error ?? ""}`);
  }

  await browser.close();

  console.log("\n--- Summary (sorted by resourceKb desc) ---\n");
  console.log(
    "path | status | ok | req | xfer KB | resource KB | types | error"
  );
  console.log("-".repeat(100));

  for (const r of [...rows].sort((a, b) => b.resourceKb - a.resourceKb)) {
    console.log(
      `${r.path} | ${r.status} | ${r.ok} | ${r.requests} | ${r.transferredKb} | ${r.resourceKb} | ${r.topTypes} | ${r.error ?? ""}`
    );
  }

  const failed = rows.filter((r) => !r.ok);
  const heavy = rows.filter((r) => r.resourceKb > 8000 || r.requests > 80);

  console.log(`\nFailed: ${failed.length}/${rows.length}`);
  console.log(`Heavy (>8MB resource or >80 req): ${heavy.length}`);

  if (heavy.length) {
    console.log("\nHeaviest pages:");
    for (const r of heavy) {
      console.log(`  ${r.path}: ${r.resourceKb} KB, ${r.requests} requests`);
    }
  }
}

void main();
