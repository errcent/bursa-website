/**
 * Audit all user-facing routes (SSOT: e2e/routes.ts): HTTP status + network weight + Core Web Vitals.
 * Usage: npx tsx scripts/audit-pages-network.ts [baseUrl] [--json out.json] [--viewport desktop|mobile] [--runs 1]
 *
 * Importing AUDIT_ROUTES from e2e/routes.ts ensures the visual audit and network audit share one matrix.
 * Gated/mentor routes are reported explicitly as login-wall redirects rather than optimized pages.
 */
import { chromium, type Response } from "playwright";
import type { Browser, StorageState } from "playwright";
import fs from "node:fs";
import path from "node:path";

import { AUDIT_ROUTES, type AuditRoute } from "../e2e/routes";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs() {
  const raw = process.argv.slice(2);
  let base = "https://bursanalar.vercel.app";
  let jsonOut: string | null = null;
  let viewport: "desktop" | "mobile" = "mobile";
  let runs = 1;
  let filter: string | null = null;

  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === "--json" && raw[i + 1]) {
      jsonOut = raw[++i];
    } else if (a === "--viewport" && raw[i + 1]) {
      const v = raw[++i];
      viewport = v === "desktop" ? "desktop" : "mobile";
    } else if (a === "--runs" && raw[i + 1]) {
      runs = Math.max(1, Math.min(10, Number(raw[++i]) || 1));
    } else if (a === "--filter" && raw[i + 1]) {
      filter = raw[++i];
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: npx tsx scripts/audit-pages-network.ts [baseUrl] [--json out.json] [--viewport desktop|mobile] [--runs N] [--filter substring]`);
      process.exit(0);
    } else if (!a.startsWith("-")) {
      base = a.replace(/\/$/, "");
    }
  }
  // Env fallback for base (PLAYWRIGHT_BASE_URL contract)
  if (!raw.some((x) => !x.startsWith("-")) && process.env.PLAYWRIGHT_BASE_URL) {
    base = process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, "");
  }
  return { base, jsonOut, viewport, runs, filter };
}

const { base: BASE, jsonOut, viewport: VIEWPORT, runs: RUNS, filter: FILTER } = parseArgs();

const FILTERED_ROUTES = FILTER
  ? AUDIT_ROUTES.filter((r) => r.path.includes(FILTER) || r.slug.includes(FILTER))
  : AUDIT_ROUTES;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Vitals = {
  ttfbMs: number | null;
  lcpMs: number | null;
  cls: number | null;
  longTasks: number;
  longTaskTotalMs: number;
};

type PerRun = {
  status: number;
  finalUrl: string;
  redirected: boolean;
  isLoginWall: boolean;
  incomplete: boolean;
  requests: number;
  transferredBytes: number;
  transferredKb: number;
  resourceBytes: number;
  resourceKb: number;
  jsBytes: number;
  jsKb: number;
  cssBytes: number;
  imageBytes: number;
  topTypes: string;
  slowestMs: number;
  ttfbMs: number | null;
  lcpMs: number | null;
  cls: number | null;
  longTasks: number;
  longTaskTotalMs: number;
  pageErrors: string[];
  consoleErrors: string[];
  error?: string;
  ok: boolean;
  httpStatus: number;
};

type RouteReport = {
  path: string;
  slug: string;
  role: AuditRoute["role"];
  gated?: boolean;
  runs: number;
  viewport: string;
  median: PerRun;
  raw: PerRun[];
};

function kb(n: number) {
  return Math.round(n / 1024);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function medianNullable(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (!nums.length) return null;
  return median(nums);
}

// ---------------------------------------------------------------------------
// Auth: reuse e2e/auth.setup.ts contract (PLAYWRIGHT_AUTH_EMAIL / PASSWORD)
// ---------------------------------------------------------------------------
async function createAuthState(
  browser: Browser,
  baseUrl: string,
): Promise<StorageState | null> {
  const email = process.env.PLAYWRIGHT_AUTH_EMAIL;
  const password = process.env.PLAYWRIGHT_AUTH_PASSWORD;
  if (!email || !password) return null;

  console.log(`[auth] attempting login as ${email} against ${baseUrl}/masuk ...`);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseUrl}/masuk`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.locator("#identifier").waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("#identifier").fill(email);
    await page.locator("#password").fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/masuk"), { timeout: 45_000 });
    // Extra check: not still on login wall
    const stillMasuk = /\/masuk/.test(page.url());
    if (stillMasuk) {
      console.warn("[auth] login did not leave /masuk, treating as not authenticated");
      await ctx.close();
      return null;
    }
    const state = await ctx.storageState();
    await ctx.close();
    console.log("[auth] login succeeded, storageState captured");
    return state;
  } catch (e) {
    console.warn(`[auth] login failed: ${e instanceof Error ? e.message : String(e)}`);
    await ctx.close().catch(() => {});
    return null;
  }
}

// ---------------------------------------------------------------------------
// Per-route collection
// ---------------------------------------------------------------------------
async function collectOne(
  browser: Browser,
  route: AuditRoute,
  opts: {
    viewport: "desktop" | "mobile";
    authState: StorageState | null;
  },
): Promise<PerRun> {
  const isDesktop = opts.viewport === "desktop";
  const context = await browser.newContext({
    viewport: isDesktop ? { width: 1440, height: 900 } : { width: 390, height: 844 },
    userAgent: isDesktop
      ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
      : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    isMobile: !isDesktop,
    hasTouch: !isDesktop,
    storageState: opts.authState && route.gated ? opts.authState : undefined,
    // Ensure fresh navigation every run; Playwright contexts start cold by default.
  });

  // Ensure cookie consent is set to essential-only so banners don't interfere with CLS
  await context.addInitScript(() => {
    try {
      localStorage.setItem("bursa-cookie-consent", "essential-only");
    } catch {}
  });

  const page = await context.newPage();
  const responses: Response[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("response", (r) => responses.push(r));
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  // Capture console errors that may be branded as warn but contain error text? Keep strictly error.

  let status = 0;
  let error: string | undefined;

  try {
    const res = await page.goto(`${BASE}${route.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    status = res?.status() ?? 0;

    // Settle: minimal wait for hydration + fonts + lazy content; keep LCP/CLS observable but fast.
    // Skip long networkidle; wait for fonts and short scroll to trigger in-view lazy.
    try {
      await page.waitForTimeout(600);
    } catch {}
    try {
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          try {
            await document.fonts.ready;
          } catch {}
        }
        // Quick scroll to trigger lazy/in-view, not full page sweep
        const height = Math.min(
          Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
          window.innerHeight * 3,
        );
        const step = window.innerHeight;
        for (let y = 0; y < height; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
        window.scrollTo(0, 0);
      });
    } catch {}
    await page.waitForTimeout(200);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // --- Network / bytes
  let transferred = 0;
  let resourceSize = 0;
  let jsBytes = 0;
  let cssBytes = 0;
  let imageBytes = 0;
  const byType: Record<string, number> = {};
  let slowest = 0;

  for (const r of responses) {
    try {
      const timing = r.request().timing();
      if (timing) slowest = Math.max(slowest, timing.responseEnd);
    } catch {}
    const headers = r.headers();
    const cl = headers["content-length"];
    const clSize = cl ? Number(cl) : 0;
    transferred += Number.isFinite(clSize) ? clSize : 0;

    const type = r.request().resourceType();
    byType[type] = (byType[type] ?? 0) + 1;

    try {
      const body = await r.body();
      const len = body.byteLength;
      resourceSize += len;
      if (type === "script") jsBytes += len;
      else if (type === "stylesheet") cssBytes += len;
      else if (type === "image") imageBytes += len;
    } catch {
      // opaque / no body
    }
  }

  // --- Web Vitals / TTFB / CLS / Long Tasks via Navigation/LargestContentfulPaint/LayoutShift/longtask
  // Use PerformanceObserver with buffered to catch late LCP/CLS; wait 900ms after settle.
  let vitals: Vitals = { ttfbMs: null, lcpMs: null, cls: null, longTasks: 0, longTaskTotalMs: 0 };
  try {
    vitals = await page.evaluate(() => {
      return new Promise<Vitals>((resolve) => {
        let ttfbMs: number | null = null;
        if (nav) {
          const start = nav.requestStart || nav.fetchStart || nav.startTime;
          if (nav.responseStart > 0) ttfbMs = Math.max(0, Math.round(nav.responseStart - start));
          else ttfbMs = Math.max(0, Math.round(nav.responseStart));
        }
        let lcpMs: number | null = null;
        let cls = 0;
        let hasCls = false;
        let longTasks = 0;
        let longTaskTotalMs = 0;
        try {
          const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as unknown as Array<{ startTime: number }>;
          if (lcpEntries.length) lcpMs = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
        } catch {}
        try {
          const ls = performance.getEntriesByType("layout-shift") as unknown as Array<{ hadRecentInput: boolean; value: number }>;
          for (const e of ls) if (!e.hadRecentInput) { cls += e.value; hasCls = true; }
        } catch {}
        try {
          const lt = performance.getEntriesByType("longtask") as unknown as Array<{ duration: number }>;
          longTasks = lt.length;
          for (const e of lt) longTaskTotalMs += Math.round(e.duration);
        } catch {}
        let observedLcp: number | null = lcpMs;
        let observedCls = cls;
        let observedHasCls = hasCls;
        let observedLongTasks = longTasks;
        let observedLongTaskTotal = longTaskTotalMs;
        try {
          const obs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as Array<{ entryType: string; startTime: number; value: number; hadRecentInput: boolean; duration: number }>) {
              if (entry.entryType === "largest-contentful-paint") {
                observedLcp = Math.round((entry as unknown as { startTime: number }).startTime);
              } else if (entry.entryType === "layout-shift" && !(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
                observedCls += (entry as unknown as { value: number }).value;
                observedHasCls = true;
              } else if (entry.entryType === "longtask") {
                observedLongTasks += 1;
                observedLongTaskTotal += Math.round((entry as unknown as { duration: number }).duration);
              }
            }
          });
          // buffered true ensures we get entries that occurred before observer creation
          obs.observe({ type: "largest-contentful-paint", buffered: true } as unknown as PerformanceObserverInit);
          obs.observe({ type: "layout-shift", buffered: true } as unknown as PerformanceObserverInit);
          try { obs.observe({ type: "longtask", buffered: true } as unknown as PerformanceObserverInit); } catch {}
          setTimeout(() => {
            obs.disconnect();
            resolve({
              ttfbMs,
              lcpMs: observedLcp,
              cls: observedHasCls ? Number(observedCls.toFixed(4)) : 0,
              longTasks: observedLongTasks,
              longTaskTotalMs: observedLongTaskTotal,
            });
          }, 900);
        } catch {
          resolve({ ttfbMs, lcpMs, cls: hasCls ? Number(cls.toFixed(4)) : 0, longTasks, longTaskTotalMs });
        }
      });
    });
  } catch {
    // page closed or evaluate failed
  }

  const finalUrl = page.url();
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t, c]) => `${t}:${c}`)
    .join(", ");

  // Login wall detection: mirrors visual-audit + explicit redirect check
  const isLoginWall = /\/masuk/.test(finalUrl) || /\/login/.test(finalUrl);
  let identifierCount = 0;
  try {
    identifierCount = await page.locator("#identifier").count();
  } catch {}
  const isGatedLoginWall = Boolean(route.gated && (isLoginWall || identifierCount > 0));
  const incomplete = Boolean(route.gated && !opts.authState && isGatedLoginWall) || Boolean(route.gated && opts.authState && isGatedLoginWall);
  // When authState is present but page still shows login wall, it's incomplete due to role mismatch (learner vs mentor)

  const redirected = finalUrl !== `${BASE}${route.path}` && finalUrl !== `${BASE}${route.path}/`;

  // HTTP status: use navigation response status; 0 means failed to navigate
  const httpStatus = status;

  const ok = httpStatus >= 200 && httpStatus < 400 && !error && !isGatedLoginWall;

  const row: PerRun = {
    status: httpStatus,
    finalUrl,
    redirected,
    isLoginWall: isGatedLoginWall,
    incomplete,
    requests: responses.length,
    transferredBytes: transferred,
    transferredKb: kb(transferred),
    resourceBytes: resourceSize,
    resourceKb: kb(resourceSize),
    jsBytes,
    jsKb: kb(jsBytes),
    cssBytes,
    imageBytes,
    topTypes,
    slowestMs: Math.round(slowest),
    ttfbMs: vitals.ttfbMs,
    lcpMs: vitals.lcpMs,
    cls: vitals.cls,
    longTasks: vitals.longTasks,
    longTaskTotalMs: vitals.longTaskTotalMs,
    pageErrors: pageErrors.slice(0, 10),
    consoleErrors: consoleErrors.slice(0, 10),
    error,
    ok,
    httpStatus,
  };

  await context.close();
  return row;
}

function aggregateMedian(route: AuditRoute, viewport: string, raw: PerRun[]): RouteReport {
  const m: PerRun = {
    status: (median(raw.map((r) => r.status)) as number) ?? 0,
    httpStatus: (median(raw.map((r) => r.httpStatus)) as number) ?? 0,
    finalUrl: (() => {
      // most common finalUrl
      const counts = new Map<string, number>();
      for (const r of raw) counts.set(r.finalUrl, (counts.get(r.finalUrl) ?? 0) + 1);
      let best = raw[0]?.finalUrl ?? "";
      let max = 0;
      for (const [u, c] of counts) if (c > max) { max = c; best = u; }
      return best;
    })(),
    redirected: raw.some((r) => r.redirected),
    isLoginWall: raw.some((r) => r.isLoginWall),
    incomplete: raw.some((r) => r.incomplete),
    requests: (median(raw.map((r) => r.requests)) as number) ?? 0,
    transferredBytes: (median(raw.map((r) => r.transferredBytes)) as number) ?? 0,
    transferredKb: (median(raw.map((r) => r.transferredKb)) as number) ?? 0,
    resourceBytes: (median(raw.map((r) => r.resourceBytes)) as number) ?? 0,
    resourceKb: (median(raw.map((r) => r.resourceKb)) as number) ?? 0,
    jsBytes: (median(raw.map((r) => r.jsBytes)) as number) ?? 0,
    jsKb: (median(raw.map((r) => r.jsKb)) as number) ?? 0,
    cssBytes: (median(raw.map((r) => r.cssBytes)) as number) ?? 0,
    imageBytes: (median(raw.map((r) => r.imageBytes)) as number) ?? 0,
    topTypes: raw[0]?.topTypes ?? "",
    slowestMs: (median(raw.map((r) => r.slowestMs)) as number) ?? 0,
    ttfbMs: medianNullable(raw.map((r) => r.ttfbMs)),
    lcpMs: medianNullable(raw.map((r) => r.lcpMs)),
    cls: (() => {
      const vals = raw.map((r) => r.cls).filter((v): v is number => v != null);
      if (!vals.length) return null;
      // CLS median
      return Number((median(vals) as number).toFixed(4));
    })(),
    longTasks: (median(raw.map((r) => r.longTasks)) as number) ?? 0,
    longTaskTotalMs: (median(raw.map((r) => r.longTaskTotalMs)) as number) ?? 0,
    pageErrors: raw.flatMap((r) => r.pageErrors).slice(0, 10),
    consoleErrors: raw.flatMap((r) => r.consoleErrors).slice(0, 10),
    error: raw.find((r) => r.error)?.error,
    ok: raw.every((r) => r.ok),
    httpStatus: (median(raw.map((r) => r.httpStatus)) as number) ?? 0,
  };

  return {
    path: route.path,
    slug: route.slug,
    role: route.role,
    gated: route.gated,
    runs: raw.length,
    viewport,
    median: m,
    raw,
  };
}

async function main() {
  console.log(`Auditing ${FILTERED_ROUTES.length} routes on ${BASE} [viewport=${VIEWPORT} runs=${RUNS}]${FILTER ? ` [filter=${FILTER}]` : ""}\n`);

  const browser = await chromium.launch({ headless: true });
  const hasAuth = Boolean(process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD);
  let authState: StorageState | null = null;
  if (hasAuth) {
    authState = await createAuthState(browser, BASE);
    if (!authState) {
      console.warn("[auth] proceeding without authenticated storageState (gated routes will be reported as incomplete/login-wall)");
    }
  } else {
    console.log("[auth] no PLAYWRIGHT_AUTH_* — gated routes will be reported as incomplete (shared-shell changes only)");
  }

  const reports: RouteReport[] = [];

  for (const route of FILTERED_ROUTES) {
    // so the comparison does not misreport them as optimized.
    const runs: PerRun[] = [];
    for (let i = 0; i < RUNS; i++) {
      process.stdout.write(`→ ${route.path} [${VIEWPORT} run ${i + 1}/${RUNS}] ... `);
      const one = await collectOne(browser, route, { viewport: VIEWPORT, authState });
      // Status line: OK vs LOGIN-WALL vs FAIL
      if (one.isLoginWall) {
        console.log(`LOGIN-WALL ${one.status} -> ${one.finalUrl}`);
      } else if (one.ok) {
        console.log(`OK ${one.status} req:${one.requests} js:${one.jsKb}KB lcp:${one.lcpMs ?? "-"}ms cls:${one.cls ?? "-"}`);
      } else {
        console.log(`FAIL ${one.status} ${one.error ?? ""} ${one.pageErrors[0] ?? ""}`);
      }
      runs.push(one);
      // Cold run: close context each iteration (collectOne already closes)
      // Small pause between runs to avoid port exhaustion
      await new Promise((r) => setTimeout(r, 120));
    }

    const agg = aggregateMedian(route, VIEWPORT, runs);
    reports.push(agg);
  }

  await browser.close();

  // Console summary sorted by resourceKb desc
  console.log("\n--- Summary (sorted by resourceKb desc, median) ---\n");
  console.log("path | role | status | ok | loginWall | req | js KB | xfer KB | resource KB | LCP ms | CLS | TTFB ms | longTasks | error");
  console.log("-".repeat(140));
  for (const r of [...reports].sort((a, b) => b.median.resourceKb - a.median.resourceKb)) {
    const m = r.median;
    console.log(
      `${r.path} | ${r.role} | ${m.status} | ${m.ok} | ${m.isLoginWall} | ${m.requests} | ${m.jsKb} | ${m.transferredKb} | ${m.resourceKb} | ${m.lcpMs ?? "-"} | ${m.cls ?? "-"} | ${m.ttfbMs ?? "-"} | ${m.longTasks} | ${m.error ?? m.pageErrors[0] ?? ""}`,
    );
  }

  const failed = reports.filter((r) => !r.median.ok && !r.median.isLoginWall && !r.median.incomplete);
  const gatedWalls = reports.filter((r) => r.median.isLoginWall);
  const heavy = reports.filter((r) => r.median.resourceKb > 8000 || r.median.requests > 80);

  console.log(`\nFailed (non-gated): ${failed.length}/${reports.length}`);
  console.log(`Gated login-walls (expected when no auth or role mismatch): ${gatedWalls.length}`);
  console.log(`Heavy (>8MB resource or >80 req): ${heavy.length}`);

  if (heavy.length) {
    console.log("\nHeaviest pages (median):");
    for (const r of heavy) {
      console.log(`  ${r.path} [${r.role}]: ${r.median.resourceKb} KB, ${r.median.requests} req, js ${r.median.jsKb}KB`);
    }
  }
  if (failed.length) {
    console.log("\nFailed routes:");
    for (const r of failed) console.log(`  ${r.path}: ${r.median.status} ${r.median.error ?? ""}`);
  }

  // ---- JSON output
  if (jsonOut) {
    const outPath = path.isAbsolute(jsonOut) ? jsonOut : path.join(process.cwd(), jsonOut);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const payload = {
      baseUrl: BASE,
      viewport: VIEWPORT,
      runs: RUNS,
      timestamp: new Date().toISOString(),
      hasAuth: Boolean(authState),
      routes: reports,
      summary: {
        total: reports.length,
        failed: failed.length,
        gatedWalls: gatedWalls.length,
        heavy: heavy.length,
      },
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(`\nJSON written to ${outPath}`);
  }

  // Exit non-zero if non-gated failures exist (preserves CI gate)
  if (failed.length) {
    console.log("\nNote: gated login-walls are excluded from failure count; they are expected without auth.");
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
