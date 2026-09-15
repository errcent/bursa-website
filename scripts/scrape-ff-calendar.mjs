/**
 * Free FF weekly JSON (no API key) into data/note/economic-calendar/.
 * Sources: cdn-nfs / nfs faireconomy mirror (same as FF weekly export).
 * Month history: self-host https://github.com/ehsanrs2/forexfactory-scraper
 * Run: npm run note:scrape-econ
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FEEDS = (
  process.env.NOTE_FF_JSON_URLS?.split(",").map((s) => s.trim()).filter(Boolean) ??
  (process.env.NOTE_FF_JSON_URL?.trim()
    ? [process.env.NOTE_FF_JSON_URL.trim()]
    : [
        "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
        "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
      ])
);
const OUT_DIR = path.join(process.cwd(), "data", "note", "economic-calendar");

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
    return Array.isArray(parsed) ? parsed : parsed?.events ?? [];
  } catch {
    return [];
  }
}

async function fetchWeekJson() {
  let lastStatus = 0;
  for (const url of FEEDS) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    lastStatus = res.status;
    if (res.ok) {
      const week = await res.json();
      return { week, url };
    }
  }
  throw new Error(`All feeds failed (last HTTP ${lastStatus})`);
}

async function main() {
  const { week, url: JSON_URL } = await fetchWeekJson();
  if (!Array.isArray(week)) {
    console.error("Unexpected payload");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const archivePath = path.join(OUT_DIR, "archive.json");
  const latestPath = path.join(OUT_DIR, "scrape-latest.json");
  const archive = await loadJson(archivePath);
  const map = new Map();
  for (const row of archive) map.set(eventKey(row), row);
  for (const row of week) map.set(eventKey(row), row);
  const merged = [...map.values()].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? ""))
  );

  const fetchedAt = new Date().toISOString();
  const envelope = { fetchedAt, source: JSON_URL, events: merged };

  await writeFile(latestPath, JSON.stringify(week, null, 2), "utf8");
  await writeFile(archivePath, JSON.stringify(merged, null, 2), "utf8");

  const months = new Set(merged.map((r) => String(r.date ?? "").slice(0, 7)).filter(Boolean));
  for (const ym of months) {
    const monthRows = merged.filter((r) => String(r.date ?? "").startsWith(ym));
    await writeFile(path.join(OUT_DIR, `${ym}.json`), JSON.stringify(monthRows, null, 2), "utf8");
  }

  console.log(`Scraped ${week.length} rows; archive ${merged.length} → ${OUT_DIR}`);
  console.log(`Latest: ${latestPath} @ ${fetchedAt}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
