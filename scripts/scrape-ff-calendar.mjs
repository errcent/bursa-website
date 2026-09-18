/**
 * Free FF weekly JSON (no API key) into data/note/economic-calendar/.
 * Sources: cdn-nfs / nfs faireconomy mirror (same as FF weekly export).
 * Month history: self-host https://github.com/ehsanrs2/forexfactory-scraper
 * Run: npm run note:scrape-econ
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
];
const ALLOWED_FEED_HOSTS = new Set(["nfs.faireconomy.media", "cdn-nfs.faireconomy.media"]);
const OUT_DIR = path.resolve(process.cwd(), "data", "note", "economic-calendar");
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_FIELD_LEN = 512;
const MONTH_KEY = /^\d{4}-\d{2}$/;
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

const FEEDS = resolveFeedUrls();

function resolveFeedUrls() {
  const fromEnv =
    process.env.NOTE_FF_JSON_URLS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ??
    (process.env.NOTE_FF_JSON_URL?.trim() ? [process.env.NOTE_FF_JSON_URL.trim()] : DEFAULT_FEEDS);
  return fromEnv.map(assertAllowedFeedUrl);
}

/** @param {string} urlString */
function assertAllowedFeedUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid feed URL: ${urlString}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Feed must use HTTPS: ${urlString}`);
  }
  if (!ALLOWED_FEED_HOSTS.has(url.hostname)) {
    throw new Error(`Feed host not allowlisted: ${url.hostname}`);
  }
  if (!url.pathname.endsWith(".json")) {
    throw new Error(`Feed path must end with .json: ${urlString}`);
  }
  return url.href;
}

/** @param {unknown} value @param {number} maxLen */
function clampString(value, maxLen) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.length <= maxLen ? s : s.slice(0, maxLen);
}

/** @param {unknown} row */
function sanitizeForexFactoryEventRow(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const title = clampString(row.title, MAX_FIELD_LEN);
  if (!title) return null;
  const dateRaw = clampString(row.date, 64);
  if (!ISO_DATE_PREFIX.test(dateRaw)) return null;
  const safe = {
    title,
    country: clampString(row.country, 32) || "-",
    date: dateRaw,
    impact: clampString(row.impact, 32) || "Low",
    forecast: clampString(row.forecast, MAX_FIELD_LEN),
    previous: clampString(row.previous, MAX_FIELD_LEN),
  };
  const actual = clampString(row.actual, MAX_FIELD_LEN);
  if (actual) safe.actual = actual;
  return safe;
}

/**
 * Validates network JSON into a fixed-shape array before any file write.
 * @param {unknown} payload
 */
function sanitizeForexFactoryWeekRows(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("Expected JSON array of calendar events");
  }
  if (payload.length > MAX_ROWS) {
    throw new Error(`Too many events (${payload.length}); max ${MAX_ROWS}`);
  }
  const out = [];
  for (const row of payload) {
    const safe = sanitizeForexFactoryEventRow(row);
    if (safe) out.push(safe);
  }
  if (out.length === 0) {
    throw new Error("No valid calendar events after validation");
  }
  return out;
}

/** @param {string} ym */
function assertMonthKey(ym) {
  if (!MONTH_KEY.test(ym)) {
    throw new Error(`Invalid month key: ${ym}`);
  }
  return ym;
}

/** @param {string} fileName */
function resolveOutputPath(fileName) {
  const base = path.basename(fileName);
  if (base !== fileName) {
    throw new Error(`Refusing path traversal in output name: ${fileName}`);
  }
  const resolved = path.resolve(OUT_DIR, base);
  if (!resolved.startsWith(`${OUT_DIR}${path.sep}`) && resolved !== OUT_DIR) {
    throw new Error(`Output path escapes calendar directory: ${fileName}`);
  }
  return resolved;
}

function eventKey(row) {
  const title = String(row.title ?? "").trim();
  const country = String(row.country ?? "");
  const date = String(row.date ?? "").slice(0, 10);
  return `${date}|${country}|${title}`;
}

async function loadJson(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const rows = Array.isArray(parsed) ? parsed : parsed?.events ?? [];
    return sanitizeForexFactoryWeekRows(rows);
  } catch {
    return [];
  }
}

async function fetchWeekJson() {
  let lastStatus = 0;
  for (const url of FEEDS) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    lastStatus = res.status;
    if (!res.ok) continue;

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !/json|text\/plain/i.test(contentType)) {
      console.warn(`Skipping ${url}: unexpected content-type ${contentType}`);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PAYLOAD_BYTES) {
      throw new Error(`Feed payload too large (${buf.length} bytes)`);
    }

    let parsed;
    try {
      parsed = JSON.parse(buf.toString("utf8"));
    } catch {
      console.warn(`Skipping ${url}: invalid JSON`);
      continue;
    }

    const week = sanitizeForexFactoryWeekRows(parsed);
    return { week, url };
  }
  throw new Error(`All feeds failed (last HTTP ${lastStatus})`);
}

async function writeJsonFile(fileName, data) {
  const filePath = resolveOutputPath(fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  const { week, url: feedUrl } = await fetchWeekJson();

  await mkdir(OUT_DIR, { recursive: true });

  const archive = await loadJson(resolveOutputPath("archive.json"));
  const map = new Map();
  for (const row of archive) map.set(eventKey(row), row);
  for (const row of week) map.set(eventKey(row), row);
  const merged = [...map.values()].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? ""))
  );

  const fetchedAt = new Date().toISOString();

  await writeJsonFile("scrape-latest.json", week);
  await writeJsonFile("archive.json", merged);

  const months = new Set(
    merged.map((r) => String(r.date ?? "").slice(0, 7)).filter((ym) => MONTH_KEY.test(ym))
  );
  for (const ym of months) {
    const monthKey = assertMonthKey(ym);
    const monthRows = merged.filter((r) => String(r.date ?? "").startsWith(monthKey));
    await writeJsonFile(`${monthKey}.json`, monthRows);
  }

  console.log(`Scraped ${week.length} rows; archive ${merged.length} → ${OUT_DIR}`);
  console.log(`Latest: ${resolveOutputPath("scrape-latest.json")} @ ${fetchedAt} (${feedUrl})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
