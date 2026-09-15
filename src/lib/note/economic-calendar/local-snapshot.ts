import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseForexFactoryJson } from "@/lib/note/economic-calendar/parse-ff-json";
import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

function monthKeyFromRange(from: string): string {
  return from.slice(0, 7);
}

async function readJsonFile(filePath: string): Promise<EconomicEvent[] | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parseForexFactoryJson(parsed);
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { events?: unknown }).events)) {
      return parseForexFactoryJson((parsed as { events: unknown[] }).events);
    }
    return null;
  } catch {
    return null;
  }
}

/** Optional on-disk month cache (seed via `npm run note:sync-econ-calendar`). */
export async function loadLocalMonthSnapshot(from: string, to: string): Promise<EconomicEvent[] | null> {
  const ym = monthKeyFromRange(from);
  const custom = process.env.NOTE_FF_MONTH_SNAPSHOT_PATH?.trim();
  const candidates = [
    custom?.replace("{YYYY-MM}", ym),
    path.join(process.cwd(), "data", "note", "economic-calendar", `${ym}.json`),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidates) {
    const events = await readJsonFile(filePath);
    if (events?.length) {
      return events
        .map((e) => ({ ...e, source: "month_snapshot" as const }))
        .filter((e) => e.date >= from && e.date <= to);
    }
  }
  return null;
}

export async function loadRemoteMonthSnapshot(from: string, to: string): Promise<EconomicEvent[] | null> {
  const urlTemplate = process.env.NOTE_FF_MONTH_SNAPSHOT_URL?.trim();
  if (!urlTemplate) return null;
  const ym = monthKeyFromRange(from);
  const url = urlTemplate.replace("{YYYY-MM}", ym);
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const body = (await res.json()) as unknown;
    const events = parseForexFactoryJson(Array.isArray(body) ? body : (body as { events?: unknown[] }).events);
    if (!events.length) return null;
    return events
      .map((e) => ({ ...e, source: "month_snapshot" as const }))
      .filter((e) => e.date >= from && e.date <= to);
  } catch {
    return null;
  }
}
