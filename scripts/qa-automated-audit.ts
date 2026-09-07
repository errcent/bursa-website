/**
 * Automated QA + security audit via Playwright + CDP.
 * Usage: npx tsx scripts/qa-automated-audit.ts [baseUrl]
 * Output: e2e/reports/qa-audit-{timestamp}.json
 */
import { chromium, type CDPSession, type Page, type Response } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { AUDIT_ROUTES } from "../e2e/routes";

const BASE = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const OUT_DIR = path.join(__dirname, "../e2e/reports");

type Sev = "critical" | "high" | "med" | "low" | "info";
type Finding = {
  id: string;
  category: "bug" | "security" | "a11y" | "perf" | "ux";
  severity: Sev;
  title: string;
  detail: string;
  route?: string;
  evidence?: string;
};

const findings: Finding[] = [];
let seq = 0;

function add(f: Omit<Finding, "id">) {
  seq += 1;
  findings.push({ id: `QA-${String(seq).padStart(3, "0")}`, ...f });
}

const SECURITY_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
] as const;

const GATED_PATHS = [
  "/dashboard",
  "/profil",
  "/pengaturan",
  "/api/auth/session",
  "/api/note/entries",
  "/api/admin",
];

const API_PROBE = [
  { path: "/api/auth/session", expectUnauth: true },
  { path: "/api/catalog", expectUnauth: true },
  { path: "/api/note/entries", expectUnauth: false },
  { path: "/api/admin/users", expectUnauth: false },
  { path: "/api/waitlist", method: "POST" as const, body: {}, expectUnauth: false },
];

const XSS_PAYLOAD = '<img src=x onerror=alert(1)>';
const OPEN_REDIRECT = "https://evil.example/phish";

async function cdpEval<T>(cdp: CDPSession, expression: string): Promise<T> {
  const r = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value as T;
}

async function auditPage(
  page: Page,
  cdp: CDPSession,
  routePath: string,
  opts?: { skipScroll?: boolean },
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedReqs: string[] = [];

  const handlers = {
    console: (msg: { type: () => string; text: () => string; location: () => { url: string } }) => {
      if (msg.type() === "error") {
        const t = msg.text();
        if (!t.includes("posthog") && !t.includes("404") && !t.includes("favicon"))
          consoleErrors.push(t.slice(0, 300));
      }
    },
    pageerror: (e: Error) => pageErrors.push(String(e.message).slice(0, 300)),
    response: (r: Response) => {
      if (r.status() >= 400 && !r.url().includes("posthog") && !r.url().includes("analytics"))
        failedReqs.push(`${r.status()} ${r.url().slice(0, 120)}`);
    },
  };

  page.on("console", handlers.console);
  page.on("pageerror", handlers.pageerror);
  page.on("response", handlers.response);

  let status = 0;
  let finalUrl = "";
  try {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("bursa-cookie-consent", "essential-only");
      } catch {
        /* ignore */
      }
    });
    const resp = await page.goto(`${BASE}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    status = resp?.status() ?? 0;
    finalUrl = page.url();

    try {
      await page.waitForLoadState("networkidle", { timeout: 8_000 });
    } catch {
      /* long-poll ok */
    }

    if (!opts?.skipScroll) {
      await page.evaluate(async () => {
        const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const step = Math.max(window.innerHeight * 0.9, 400);
        for (let y = 0; y < h; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
    }
  } catch (e) {
    add({
      category: "bug",
      severity: "high",
      title: "Navigation failed",
      detail: String(e).slice(0, 400),
      route: routePath,
    });
    page.off("console", handlers.console);
    page.off("pageerror", handlers.pageerror);
    page.off("response", handlers.response);
    return;
  }

  if (status >= 500) {
    add({
      category: "bug",
      severity: "critical",
      title: `HTTP ${status} on page load`,
      detail: `Server error loading ${routePath}`,
      route: routePath,
      evidence: finalUrl,
    });
  } else if (status === 404 && !routePath.includes("reset")) {
    add({
      category: "bug",
      severity: "med",
      title: "404 on expected route",
      detail: routePath,
      route: routePath,
    });
  }

  for (const err of pageErrors.slice(0, 3)) {
    add({
      category: "bug",
      severity: err.toLowerCase().includes("hydration") ? "med" : "high",
      title: "Uncaught page error",
      detail: err,
      route: routePath,
    });
  }

  for (const err of consoleErrors.slice(0, 3)) {
    const sev: Sev =
      err.includes("Hydration") || err.includes("hydrat")
        ? "med"
        : err.includes("401") || err.includes("403")
          ? "low"
          : "med";
    add({
      category: "bug",
      severity: sev,
      title: "Console error",
      detail: err,
      route: routePath,
    });
  }

  for (const fr of failedReqs.slice(0, 2)) {
    if (fr.startsWith("401") || fr.startsWith("403")) continue;
    add({
      category: "bug",
      severity: fr.startsWith("5") ? "high" : "low",
      title: "Failed network request",
      detail: fr,
      route: routePath,
    });
  }

  // a11y quick scan
  const a11y = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")];
    const noAlt = imgs.filter((i) => !i.getAttribute("alt")?.trim() && !i.getAttribute("aria-hidden"));
    const inputs = [...document.querySelectorAll("input:not([type=hidden]), textarea, select")];
    const noLabel = inputs.filter((el) => {
      const id = el.id;
      const labelled =
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        (id && document.querySelector(`label[for="${id}"]`));
      return !labelled && el.getAttribute("type") !== "submit";
    });
    const h1 = document.querySelectorAll("h1").length;
    return { noAlt: noAlt.length, noLabel: noLabel.length, h1, title: document.title };
  });

  if (a11y.noAlt > 0) {
    add({
      category: "a11y",
      severity: "low",
      title: `${a11y.noAlt} img without alt`,
      detail: "Decorative imgs should have alt=\"\" or aria-hidden",
      route: routePath,
    });
  }
  if (a11y.noLabel > 2) {
    add({
      category: "a11y",
      severity: "med",
      title: `${a11y.noLabel} form controls without label`,
      detail: "Inputs missing associated label/aria",
      route: routePath,
    });
  }
  if (a11y.h1 === 0 && status === 200) {
    add({
      category: "a11y",
      severity: "low",
      title: "Missing H1",
      detail: `Page title: ${a11y.title}`,
      route: routePath,
    });
  }
  if (a11y.h1 > 1) {
    add({
      category: "a11y",
      severity: "info",
      title: `Multiple H1 (${a11y.h1})`,
      detail: "Consider single primary heading",
      route: routePath,
    });
  }

  // perf: DOM size + CLS proxy via layout shifts (CDP)
  try {
    await cdp.send("Performance.enable");
    const metrics = await cdp.send("Performance.getMetrics");
    const domNodes = metrics.metrics.find((m) => m.name === "Nodes")?.value ?? 0;
    if (domNodes > 2500) {
      add({
        category: "perf",
        severity: "med",
        title: "Large DOM",
        detail: `${Math.round(domNodes)} nodes — may hurt interaction perf`,
        route: routePath,
      });
    }
  } catch {
    /* CDP optional */
  }

  page.off("console", handlers.console);
  page.off("pageerror", handlers.pageerror);
  page.off("response", handlers.response);
}

async function auditSecurityHeaders(page: Page) {
  const resp = await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const headers = resp?.headers() ?? {};
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

  for (const h of SECURITY_HEADERS) {
    if (!lower[h]) {
      const sev: Sev = h === "content-security-policy" || h === "strict-transport-security" ? "high" : "med";
      add({
        category: "security",
        severity: BASE.startsWith("http://") && h === "strict-transport-security" ? "info" : sev,
        title: `Missing header: ${h}`,
        detail: BASE.startsWith("http://") && h === "strict-transport-security" ? "Expected absent on localhost HTTP" : "Response lacks security header",
        route: "/",
      });
    }
  }

  if (lower["content-security-policy"]?.includes("'unsafe-inline'")) {
    add({
      category: "security",
      severity: "med",
      title: "CSP allows unsafe-inline",
      detail: "XSS mitigation weakened",
      route: "/",
    });
  }
  if (lower["x-frame-options"]?.toLowerCase() === "sameorigin") {
    add({
      category: "security",
      severity: "low",
      title: "X-Frame-Options SAMEORIGIN",
      detail: "Clickjacking possible on same origin embeds",
      route: "/",
    });
  }
}

async function auditCookies(context: import("playwright").BrowserContext, page: Page) {
  await page.goto(`${BASE}/masuk`, { waitUntil: "domcontentloaded" });
  const cookies = await context.cookies(BASE);
  for (const c of cookies) {
    if (c.name.toLowerCase().includes("session") || c.name.toLowerCase().includes("auth")) {
      if (!c.httpOnly) {
        add({
          category: "security",
          severity: "high",
          title: `Session cookie not HttpOnly: ${c.name}`,
          detail: "XSS can steal session",
          route: "/masuk",
        });
      }
      if (BASE.startsWith("https") && !c.secure) {
        add({
          category: "security",
          severity: "high",
          title: `Session cookie not Secure: ${c.name}`,
          detail: "Transmittable over HTTP",
          route: "/masuk",
        });
      }
      if (!c.sameSite || c.sameSite === "None") {
        add({
          category: "security",
          severity: "med",
          title: `Cookie SameSite weak: ${c.name}`,
          detail: `sameSite=${c.sameSite ?? "unset"}`,
          route: "/masuk",
        });
      }
    }
  }
}

async function auditGatedAccess(page: Page) {
  const ctx = page.context();
  await ctx.clearCookies();
  for (const p of GATED_PATHS) {
    const r = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const status = r?.status() ?? 0;
    const url = page.url();
    const isApi = p.startsWith("/api/");
    if (isApi) {
      if (status === 200) {
        const body = await r?.text();
        if (body && !body.includes("null") && body.length > 20 && !body.includes("unauthorized")) {
          add({
            category: "security",
            severity: "critical",
            title: "Unauthenticated API returns data",
            detail: `${p} → ${status}, body len ${body.length}`,
            route: p,
            evidence: body.slice(0, 120),
          });
        }
      }
    } else {
      const leaked =
        status === 200 &&
        !url.includes("/masuk") &&
        !url.includes("/login") &&
        !url.includes("/daftar") &&
        (await page.locator('[data-testid="dashboard"], main').count()) > 0;
      if (leaked && (p === "/dashboard" || p === "/profil")) {
        const hasAuthUi = await page.getByText(/keluar|logout|profil/i).count();
        if (hasAuthUi > 0) {
          add({
            category: "security",
            severity: "critical",
            title: "Gated page accessible without auth",
            detail: `${p} rendered authenticated UI`,
            route: p,
            evidence: url,
          });
        }
      }
    }
  }
}

async function auditApiProbes(page: Page) {
  for (const probe of API_PROBE) {
    const url = `${BASE}${probe.path}`;
    let status = 0;
    let body = "";
    try {
      if (probe.method === "POST") {
        const r = await page.request.post(url, {
          data: probe.body,
          headers: { "Content-Type": "application/json" },
        });
        status = r.status();
        body = (await r.text()).slice(0, 200);
      } else {
        const r = await page.request.get(url);
        status = r.status();
        body = (await r.text()).slice(0, 200);
      }
    } catch (e) {
      add({ category: "bug", severity: "med", title: "API probe failed", detail: `${probe.path}: ${e}`, route: probe.path });
      continue;
    }

    if (!probe.expectUnauth && status === 200 && body.length > 5 && !body.includes('"error"')) {
      add({
        category: "security",
        severity: probe.path.includes("admin") ? "critical" : "high",
        title: "Sensitive API open without auth",
        detail: `${probe.path} → ${status}`,
        route: probe.path,
        evidence: body,
      });
    }
    if (probe.expectUnauth && status >= 500) {
      add({
        category: "bug",
        severity: "high",
        title: "Public API server error",
        detail: `${probe.path} → ${status}`,
        route: probe.path,
      });
    }
  }
}

async function auditXssReflection(page: Page) {
  const routes = [
    `/katalog?q=${encodeURIComponent(XSS_PAYLOAD)}`,
    `/katalog?search=${encodeURIComponent(XSS_PAYLOAD)}`,
    `/masuk?next=${encodeURIComponent(OPEN_REDIRECT)}`,
    `/masuk?redirect=${encodeURIComponent(OPEN_REDIRECT)}`,
    `/masuk?callbackUrl=${encodeURIComponent(OPEN_REDIRECT)}`,
  ];
  for (const r of routes) {
    await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const html = await page.content();
    if (html.includes("onerror=alert") && !html.includes("&lt;img") && !html.includes("%3Cimg")) {
      add({
        category: "security",
        severity: "critical",
        title: "Reflected XSS in HTML",
        detail: r.split("?")[0],
        route: r,
      });
    }
    const url = page.url();
    const landedExternal =
      (() => {
        try {
          return new URL(url).hostname === "evil.example";
        } catch {
          return false;
        }
      })();
    if (landedExternal) {
      add({
        category: "security",
        severity: "critical",
        title: "Open redirect",
        detail: `Landed on external domain from ${r}`,
        route: r,
      });
    }
    // check if evil URL in link href without validation
    const evilLinks = await page.locator('a[href*="evil.example"]').count();
    if (evilLinks > 0) {
      add({
        category: "security",
        severity: "high",
        title: "Unvalidated redirect param in link",
        detail: `${evilLinks} links to evil.example`,
        route: r,
      });
    }
  }
}

async function auditStorage(page: Page, cdp: CDPSession) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const storage = await cdpEval<{ ls: Record<string, string>; ss: Record<string, string> }>(
    cdp,
    `(() => {
      const ls = {}; for (let i=0;i<localStorage.length;i++){const k=localStorage.key(i); ls[k]=localStorage.getItem(k)?.slice(0,80)||'';}
      const ss = {}; for (let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i); ss[k]=sessionStorage.getItem(k)?.slice(0,80)||'';}
      return {ls, ss};
    })()`,
  );
  for (const [k, v] of Object.entries(storage.ls)) {
    if (/token|password|secret|session|jwt/i.test(k + v)) {
      add({
        category: "security",
        severity: /password|token|jwt/i.test(v) ? "high" : "med",
        title: "Sensitive data in localStorage",
        detail: `${k}=${v.slice(0, 60)}`,
        route: "/",
      });
    }
  }
}

async function auditSearchUx(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const search = page.locator('[role="searchbox"], input[type="search"], input[placeholder*="Cari"]').first();
  if ((await search.count()) === 0) {
    add({ category: "ux", severity: "med", title: "Navbar search not found", detail: "Landing", route: "/" });
    return;
  }
  const boxBefore = await search.boundingBox();
  await search.click();
  await page.waitForTimeout(350);
  const boxAfter = await search.boundingBox();
  if (boxBefore && boxAfter && boxAfter.width <= boxBefore.width * 1.05) {
    add({
      category: "ux",
      severity: "low",
      title: "Search bar does not expand on focus",
      detail: `width ${boxBefore.width} → ${boxAfter.width}`,
      route: "/",
    });
  }

  await search.fill("forex");
  await page.waitForTimeout(500);
  const dropdown = page.locator('[role="listbox"], [data-search-dropdown]').first();
  if ((await dropdown.count()) === 0) {
    add({ category: "ux", severity: "med", title: "Search dropdown missing after input", detail: "forex", route: "/" });
  } else {
    const scrollW = await dropdown.evaluate((el) => {
      const s = getComputedStyle(el);
      return { sw: el.scrollWidth, cw: el.clientWidth, overflow: s.overflowY };
    });
    if (scrollW.sw > scrollW.cw + 2 && scrollW.overflow !== "hidden") {
      add({
        category: "ux",
        severity: "low",
        title: "Search dropdown shows scrollbar",
        detail: `scroll ${scrollW.sw}/${scrollW.cw}`,
        route: "/",
      });
    }
  }
}

async function auditAuthForms(page: Page) {
  await page.goto(`${BASE}/masuk`, { waitUntil: "domcontentloaded" });
  const pwd = page.locator('input[type="password"]').first();
  if ((await pwd.count()) > 0) {
    const ac = await pwd.getAttribute("autocomplete");
    if (ac !== "current-password" && ac !== "password") {
      add({
        category: "security",
        severity: "low",
        title: "Login password missing autocomplete=current-password",
        detail: `autocomplete=${ac ?? "none"}`,
        route: "/masuk",
      });
    }
  }
  const remember = page.getByLabel(/ingat saya/i);
  if ((await remember.count()) === 0) {
    add({ category: "ux", severity: "info", title: "Remember-me checkbox absent", detail: "/masuk", route: "/masuk" });
  }

  await page.goto(`${BASE}/daftar`, { waitUntil: "domcontentloaded" });
  const lupaOnRegister = page.getByRole("link", { name: /lupa kata sandi/i });
  if ((await lupaOnRegister.count()) > 0) {
    add({
      category: "ux",
      severity: "low",
      title: "Forgot-password link on register page",
      detail: "Should be login-only per spec",
      route: "/daftar",
    });
  }
}

async function auditMixedContent(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const insecure = await page.evaluate(() =>
    [...document.querySelectorAll("[src], [href]")]
      .map((el) => (el as HTMLImageElement).src || (el as HTMLAnchorElement).href)
      .filter((u) => u.startsWith("http://") && !u.includes("localhost")),
  );
  if (insecure.length) {
    add({
      category: "security",
      severity: "med",
      title: "Mixed / insecure HTTP resources",
      detail: insecure.slice(0, 3).join("; "),
      route: "/",
    });
  }
}

async function auditRateLimit(page: Page) {
  const url = `${BASE}/api/auth/login`;
  const statuses: number[] = [];
  for (let i = 0; i < 8; i++) {
    const r = await page.request.post(url, {
      data: { email: "qa-brute@test.local", password: "wrong" },
      headers: { "Content-Type": "application/json" },
    });
    statuses.push(r.status());
  }
  const has429 = statuses.includes(429);
  if (!has429) {
    add({
      category: "security",
      severity: "med",
      title: "No rate limit on login API (8 attempts)",
      detail: `Statuses: ${statuses.join(",")}`,
      route: "/api/auth/login",
    });
  }
}

async function auditCors(page: Page) {
  const r = await page.request.fetch(`${BASE}/api/catalog`, {
    headers: { Origin: "https://evil.example" },
  });
  const acao = r.headers()["access-control-allow-origin"];
  if (acao === "*") {
    add({
      category: "security",
      severity: "med",
      title: "CORS wildcard on catalog API",
      detail: "Access-Control-Allow-Origin: *",
      route: "/api/catalog",
    });
  } else if (acao === "https://evil.example") {
    add({
      category: "security",
      severity: "high",
      title: "CORS reflects arbitrary Origin",
      detail: acao,
      route: "/api/catalog",
    });
  }
}

async function auditSensitiveFiles(page: Page) {
  const paths = ["/.env", "/.env.local", "/api/debug", "/api/health?verbose=1", "/_next/static/../.env"];
  for (const p of paths) {
    const r = await page.request.get(`${BASE}${p}`);
    const status = r.status();
    const ct = r.headers()["content-type"] ?? "";
    const body = (await r.text()).slice(0, 100);
    if (status === 200 && (body.includes("DATABASE") || body.includes("SECRET") || body.includes("API_KEY"))) {
      add({
        category: "security",
        severity: "critical",
        title: "Sensitive file/endpoint exposed",
        detail: `${p} → leaked env-like content`,
        route: p,
        evidence: body,
      });
    } else if (status === 200 && p.includes(".env")) {
      add({
        category: "security",
        severity: "critical",
        title: ".env accessible over HTTP",
        detail: p,
        route: p,
      });
    }
  }
}

async function auditArchiveRoutes(page: Page) {
  const archived = ["/lab", "/wave-lab", "/jadi-mentor", "/note"];
  for (const p of archived) {
    const r = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const status = r?.status() ?? 0;
    const url = page.url();
    if (status === 200 && !url.includes("404") && !url.includes("not-found")) {
      const title = await page.title();
      if (!title.toLowerCase().includes("not found")) {
        add({
          category: "bug",
          severity: "med",
          title: "Archived route still publicly reachable",
          detail: `${p} → 200 (${title})`,
          route: p,
        });
      }
    }
  }
}

async function auditMobileOverflow(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const r of ["/", "/katalog", "/masuk"]) {
    await page.goto(`${BASE}${r}`, { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (overflow) {
      add({
        category: "ux",
        severity: "med",
        title: "Horizontal overflow on mobile",
        detail: `scrollWidth > viewport`,
        route: r,
      });
    }
  }
}

async function main() {
  console.log(`QA audit → ${BASE}\n`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "id-ID",
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Security-first (no auth)
  await auditSecurityHeaders(page);
  await auditCookies(context, page);
  await auditGatedAccess(page);
  await auditApiProbes(page);
  await auditXssReflection(page);
  await auditStorage(page, cdp);
  await auditSensitiveFiles(page);
  await auditCors(page);
  await auditRateLimit(page);
  await auditMixedContent(page);
  await auditAuthForms(page);
  await auditSearchUx(page);
  await auditArchiveRoutes(page);
  await auditMobileOverflow(page);

  // Route crawl (subset for token/time — high-value public routes)
  const crawl = AUDIT_ROUTES.filter(
    (r) =>
      !r.gated &&
      !r.path.includes("reset") &&
      !r.path.startsWith("/lab/") &&
      r.path !== "/wave-lab" &&
      r.path !== "/komunitas",
  ).slice(0, 35);

  for (const r of crawl) {
    process.stdout.write(`· ${r.path}\n`);
    await auditPage(page, cdp, r.path);
  }

  // Dedupe similar findings
  const seen = new Set<string>();
  const unique = findings.filter((f) => {
    const key = `${f.category}|${f.severity}|${f.title}|${f.route}|${f.detail.slice(0, 80)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const summary = {
    base: BASE,
    at: new Date().toISOString(),
    total: unique.length,
    bySeverity: Object.fromEntries(
      (["critical", "high", "med", "low", "info"] as Sev[]).map((s) => [
        s,
        unique.filter((f) => f.severity === s).length,
      ]),
    ),
    byCategory: Object.fromEntries(
      (["bug", "security", "a11y", "perf", "ux"] as const).map((c) => [
        c,
        unique.filter((f) => f.category === c).length,
      ]),
    ),
    findings: unique,
  };

  const outFile = path.join(OUT_DIR, `qa-audit-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`\n✓ ${unique.length} findings → ${outFile}`);
  console.log(
    `  critical=${summary.bySeverity.critical} high=${summary.bySeverity.high} med=${summary.bySeverity.med} low=${summary.bySeverity.low} info=${summary.bySeverity.info}`,
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
