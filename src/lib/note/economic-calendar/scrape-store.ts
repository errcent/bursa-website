import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseForexFactoryJson } from "@/lib/note/economic-calendar/parse-ff-json";
import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

const SCRAPE_DIR = path.join(process.cwd(), "data", "note", "economic-calendar");

async function readRawEvents(filePath: string): Promise<unknown[] | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { events?: unknown[] }).events)) {
      return (parsed as { events: unknown[] }).events;
    }
    return null;
  } catch {
    return null;
  }
}

function tagScrape(events: EconomicEvent[]): EconomicEvent[] {
  return events.map((e) => ({ ...e, source: "scrape_snapshot" as const }));
}

/** Latest weekly scrape written by `npm run note:scrape-econ`. */
export async function loadScrapeLatest(from: string, to: string): Promise<EconomicEvent[] | null> {
  const custom = process.env.NOTE_FF_SCRAPE_PATH?.trim();
  const filePath = custom || path.join(SCRAPE_DIR, "scrape-latest.json");
  const rows = await readRawEvents(filePath);
  if (!rows?.length) return null;
  const events = parseForexFactoryJson(rows).filter((e) => e.date >= from && e.date <= to);
  return events.length ? tagScrape(events) : null;
}

/**
 * Optional raw JSON on GitHub (free self-host path):
 * export from https://github.com/ehsanrs2/forexfactory-scraper then host raw file.
 * NOTE_FF_GITHUB_RAW_URL=https://raw.githubusercontent.com/you/repo/main/ff-calendar.json
 */
export async function loadGithubRawScrape(from: string, to: string): Promise<EconomicEvent[] | null> {
  const url = process.env.NOTE_FF_GITHUB_RAW_URL?.trim();
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const body = (await res.json()) as unknown;
    const rows = Array.isArray(body) ? body : (body as { events?: unknown[] }).events;
    if (!rows?.length) return null;
    const events = parseForexFactoryJson(rows).filter((e) => e.date >= from && e.date <= to);
    return events.length ? tagScrape(events) : null;
  } catch {
    return null;
  }
}

/** Accumulated scrape archive (deduped across runs). */
export async function loadScrapeArchive(from: string, to: string): Promise<EconomicEvent[] | null> {
  const filePath = path.join(SCRAPE_DIR, "archive.json");
  const rows = await readRawEvents(filePath);
  if (!rows?.length) return null;
  const events = parseForexFactoryJson(rows).filter((e) => e.date >= from && e.date <= to);
  return events.length ? tagScrape(events) : null;
}
