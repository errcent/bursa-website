/**
 * Free Forex Factory calendar feeds (no API key, no billing).
 * Official weekly export mirror used by FF / MT indicators:
 * - https://github.com/shu-ha-ri gist (cdn-nfs.faireconomy.media)
 * - nfs.faireconomy.media (same data)
 *
 * For month history / HTML parse, self-host:
 * - https://github.com/ehsanrs2/forexfactory-scraper (--provider forexfactory-export)
 * then point NOTE_FF_SCRAPE_PATH or drop JSON under data/note/economic-calendar/
 */
/** Prefer nfs host first (cdn subdomain often fails DNS in some networks). */
export const FREE_FF_JSON_FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json",
] as const;

export const FREE_FF_XML_FEEDS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.xml",
  "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.xml",
] as const;

export function freeJsonFeedUrls(): string[] {
  const fromEnv = process.env.NOTE_FF_JSON_URLS?.split(",").map((s) => s.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  const single = process.env.NOTE_FF_JSON_URL?.trim();
  if (single) return [single];
  return [...FREE_FF_JSON_FEEDS];
}

export function freeXmlFeedUrl(): string {
  return process.env.NOTE_FF_XML_URL?.trim() || FREE_FF_XML_FEEDS[0];
}

export function freeXmlFeedUrls(): string[] {
  const single = process.env.NOTE_FF_XML_URL?.trim();
  if (single) return [single];
  return [...FREE_FF_XML_FEEDS];
}
