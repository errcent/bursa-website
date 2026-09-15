import { createHash } from "crypto";
import { unstable_cache } from "next/cache";

import { clampEconCalendarRange } from "@/lib/note/query-bounds";

import { pickNearestEvent, suggestedPollMs, formatEventCountdown } from "@/lib/note/economic-calendar/countdown";
import {
  DEFAULT_ECON_FILTER,
  filterEventsByState,
  parseFilterFromSearchParams,
  type EconomicCalendarFilterState,
} from "@/lib/note/economic-calendar/filters";
import { freeJsonFeedUrls, freeXmlFeedUrls } from "@/lib/note/economic-calendar/ff-free-feeds";
import { loadLocalMonthSnapshot, loadRemoteMonthSnapshot } from "@/lib/note/economic-calendar/local-snapshot";
import {
  loadGithubRawScrape,
  loadScrapeArchive,
  loadScrapeLatest,
} from "@/lib/note/economic-calendar/scrape-store";
import { mergeEconomicEvents } from "@/lib/note/economic-calendar/merge-events";
import { currentMonthBoundsUtc, coverageForRange } from "@/lib/note/economic-calendar/month-range";
import { parseForexFactoryJson } from "@/lib/note/economic-calendar/parse-ff-json";
import { parseForexFactoryXml } from "@/lib/note/economic-calendar/parse-ff-xml";
import { classifyEventType } from "@/lib/note/economic-calendar/event-type";
import { startsAtFromIsoField } from "@/lib/note/economic-calendar/event-datetime";
import type {
  EconomicCalendarFeatures,
  EconomicCalendarPayload,
  EconomicEvent,
  EconomicImpact,
} from "@/lib/note/economic-calendar/types";

const DISCLAIMER_ID =
  "Data kalender ekonomi pihak ketiga (bukan saran trading). Verifikasi di sumber resmi sebelum entry.";
const DISCLAIMER_EN =
  "Third-party economic calendar data (not trading advice). Confirm with official sources before entries.";

export type EconomicCalendarQuery = {
  from?: string;
  to?: string;
  locale?: "id" | "en";
  filter?: EconomicCalendarFilterState;
  volatilityCountdown?: boolean;
};

function inRange(date: string, from?: string, to?: string) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

async function fetchFfJson(url: string): Promise<EconomicEvent[]> {
  const res = await fetch(url, {
    next: { revalidate: 90 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`FF JSON ${res.status}`);
  const body = (await res.json()) as unknown;
  return parseForexFactoryJson(body);
}

async function fetchFreeFfJsonFeeds(): Promise<EconomicEvent[]> {
  const urls = freeJsonFeedUrls();
  let lastError: unknown;
  for (const url of urls) {
    try {
      return await fetchFfJson(url);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("No free FF JSON feed available");
}

async function fetchFfXml(url: string): Promise<EconomicEvent[]> {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: "application/xml,text/xml,*/*" },
  });
  if (!res.ok) throw new Error(`FF XML ${res.status}`);
  const xml = await res.text();
  return parseForexFactoryXml(xml);
}

function normalizeScraperRow(row: Record<string, unknown>): EconomicEvent | null {
  const title = String(row.title ?? row.event ?? row.name ?? "").trim();
  if (!title) return null;
  const currency = String(row.currency ?? row.country ?? "-");
  const dateRaw = String(row.date ?? row._date ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
    ? dateRaw
    : dateRaw.includes("-")
      ? dateRaw.slice(0, 10)
      : "";
  if (!date) return null;
  const impactRaw = String(row.impact ?? row.importance ?? "unknown").toLowerCase();
  const impact: EconomicImpact = impactRaw.includes("high")
    ? "high"
    : impactRaw.includes("med")
      ? "medium"
      : impactRaw.includes("low")
        ? "low"
        : "unknown";
  const timeLabel = String(row.time ?? row.time_label ?? "-");
  const startsRaw = String(row.starts_at ?? row.datetime ?? row.date ?? "");
  const startsAt = startsAtFromIsoField(startsRaw);
  return {
    id: String(row.id ?? `${date}-${title}`.slice(0, 24)),
    title,
    currency,
    date,
    timeLabel,
    startsAt,
    impact,
    eventType: classifyEventType(title),
    forecast: row.forecast != null ? String(row.forecast) : null,
    previous: row.previous != null ? String(row.previous) : null,
    actual: row.actual != null ? String(row.actual) : null,
    url: row.url != null ? String(row.url) : null,
    source: "scraper_api",
  };
}

async function fetchScraperBundle(baseUrl: string, from: string, to: string): Promise<EconomicEvent[]> {
  const url = new URL("/api/bundle", baseUrl.replace(/\/$/, ""));
  url.searchParams.set("start_date", from);
  url.searchParams.set("end_date", to);
  url.searchParams.set("sources", "forex");
  url.searchParams.set("limit", "2000");
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Scraper API ${res.status}`);
  const body = (await res.json()) as { results?: unknown[] };
  const rows = Array.isArray(body.results) ? body.results : [];
  return rows
    .map((r) => normalizeScraperRow(r as Record<string, unknown>))
    .filter((e): e is EconomicEvent => e != null);
}

const cachedFreeFfJson = unstable_cache(
  async () => fetchFreeFfJsonFeeds(),
  ["note-economic-calendar-free-ff-json"],
  { revalidate: 90 }
);

const cachedFfWeekXml = unstable_cache(
  async (xmlUrl: string) => fetchFfXml(xmlUrl),
  ["note-economic-calendar-ff-xml"],
  { revalidate: 3600 }
);

async function loadAllSources(from: string, to: string): Promise<{ events: EconomicEvent[]; provider: EconomicCalendarPayload["provider"] }> {
  const providerEnv = (process.env.NOTE_ECONOMIC_CALENDAR_PROVIDER ?? "scrape").toLowerCase();
  const scraperBase = process.env.NOTE_ECONOMIC_CALENDAR_URL?.trim();

  const scrapeFirst =
    providerEnv === "scrape" || providerEnv === "scrape_snapshot" || providerEnv === "auto";
  const tryJson =
    providerEnv === "ff_json" ||
    providerEnv === "scrape" ||
    providerEnv === "auto" ||
    providerEnv === "ff_xml";
  const tryXml = providerEnv === "ff_xml" || providerEnv === "auto";
  const tryScraper = providerEnv === "scraper_api" || providerEnv === "auto";

  let events: EconomicEvent[] = [];
  let provider: EconomicCalendarPayload["provider"] = "none";

  if (scrapeFirst) {
    const disk = mergeEconomicEvents(
      (await loadScrapeArchive(from, to)) ?? [],
      (await loadScrapeLatest(from, to)) ?? [],
      (await loadGithubRawScrape(from, to)) ?? [],
      (await loadLocalMonthSnapshot(from, to)) ?? [],
      (await loadRemoteMonthSnapshot(from, to)) ?? []
    );
    if (disk.length) {
      events = disk;
      provider = "scrape_snapshot";
    }

    if (tryJson) {
      try {
        const fresh = await cachedFreeFfJson();
        events = mergeEconomicEvents(events, fresh);
        provider = events.length ? "forexfactory_json" : provider;
      } catch {
        /* keep disk scrape */
      }
    }
  }

  if (!events.length && tryScraper && scraperBase) {
    try {
      events = await fetchScraperBundle(scraperBase, from, to);
      provider = "scraper_api";
    } catch {
      events = [];
    }
  }

  if (!scrapeFirst) {
    const snapshot =
      (await loadLocalMonthSnapshot(from, to)) ?? (await loadRemoteMonthSnapshot(from, to));
    if (snapshot?.length) {
      events = mergeEconomicEvents(snapshot, events);
      if (provider === "none") provider = "month_snapshot";
    }
  }

  if (!events.length && tryJson && !scrapeFirst) {
    try {
      events = await cachedFreeFfJson();
      provider = "forexfactory_json";
    } catch {
      events = [];
    }
  }

  if (!events.length && tryXml) {
    for (const xmlUrl of freeXmlFeedUrls()) {
      try {
        events = await cachedFfWeekXml(xmlUrl);
        provider = "forexfactory_xml";
        break;
      } catch {
        /* try next mirror */
      }
    }
  }

  return { events, provider };
}

function volatilityEnabled(requested?: boolean): boolean {
  if (requested === false) return false;
  if (process.env.NOTE_ECON_VOLATILITY_COUNTDOWN === "0") return false;
  return true;
}

function filterCacheKey(filter: EconomicCalendarFilterState): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        impacts: [...filter.impacts].sort(),
        currencies: [...filter.currencies].sort(),
        eventTypes: [...filter.eventTypes].sort(),
      })
    )
    .digest("hex")
    .slice(0, 12);
}

async function getEconomicCalendarUncached(q: EconomicCalendarQuery = {}): Promise<EconomicCalendarPayload> {
  const locale = q.locale ?? "id";
  const disclaimer = locale === "en" ? DISCLAIMER_EN : DISCLAIMER_ID;
  const month = currentMonthBoundsUtc();
  const clamped = clampEconCalendarRange(q.from ?? month.from, q.to ?? month.to);
  const from = clamped.from;
  const to = clamped.to;
  const filter = q.filter ?? DEFAULT_ECON_FILTER;
  const volatilityCountdown = volatilityEnabled(q.volatilityCountdown);
  const serverTime = new Date().toISOString();
  const nowMs = Date.parse(serverTime);

  try {
    const { events: raw, provider } = await loadAllSources(from, to);
    let events = raw.filter((e) => inRange(e.date, from, to));
    events = filterEventsByState(events, filter).sort((a, b) => {
      const ta = a.startsAt ?? `${a.date}T${a.timeLabel}`;
      const tb = b.startsAt ?? `${b.date}T${b.timeLabel}`;
      return ta.localeCompare(tb);
    });

    const coverageMeta = coverageForRange(events, from, to);
    const coverage = {
      from,
      to,
      complete: coverageMeta.complete,
      daysInRange: coverageMeta.daysInRange,
      daysWithEvents: coverageMeta.daysWithEvents,
      note:
        provider === "forexfactory_json" ||
        provider === "forexfactory_xml" ||
        provider === "scrape_snapshot"
          ? locale === "en"
            ? "Free FF weekly mirror (faireconomy CDN). Run npm run note:scrape-econ to grow local archive."
            : "Mirror mingguan FF gratis (faireconomy CDN). Jalankan npm run note:scrape-econ untuk archive lokal."
          : undefined,
    };

    const nearest = pickNearestEvent(events, nowMs);
    const nearestView = nearest
      ? formatEventCountdown(nearest, nowMs, locale, volatilityCountdown)
      : null;
    const pollIntervalSec = Math.max(15, Math.round(suggestedPollMs(nearestView) / 1000));

    const features: EconomicCalendarFeatures = {
      volatilityCountdown,
      pollIntervalSec,
    };

    return {
      provider,
      fetchedAt: serverTime,
      serverTime,
      events,
      nearestEventId: nearestView ? (nearest?.id ?? null) : null,
      disclaimer,
      coverage,
      features,
    };
  } catch {
    return {
      provider: "none",
      fetchedAt: serverTime,
      serverTime,
      events: [],
      nearestEventId: null,
      disclaimer,
      coverage: {
        from,
        to,
        complete: false,
        daysInRange: 0,
        daysWithEvents: 0,
      },
      features: {
        volatilityCountdown,
        pollIntervalSec: 120,
      },
    };
  }
}

export async function getEconomicCalendar(q: EconomicCalendarQuery = {}): Promise<EconomicCalendarPayload> {
  const locale = q.locale ?? "id";
  const filter = q.filter ?? DEFAULT_ECON_FILTER;
  const month = currentMonthBoundsUtc();
  const { from, to } = clampEconCalendarRange(q.from ?? month.from, q.to ?? month.to);
  const vol = q.volatilityCountdown === false ? "0" : "1";
  const fk = filterCacheKey(filter);

  const cached = unstable_cache(
    () =>
      getEconomicCalendarUncached({
        ...q,
        from,
        to,
        locale,
        filter,
      }),
    ["note-econ-cal", from, to, locale, fk, vol],
    { revalidate: 90 }
  );

  return cached();
}

export { parseFilterFromSearchParams, DEFAULT_ECON_FILTER };

/** Next high-impact events (for AI nudges). */
export function upcomingHighImpact(events: EconomicEvent[], limit = 3): EconomicEvent[] {
  return events.filter((e) => e.impact === "high").slice(0, limit);
}
