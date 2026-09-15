import type { EconomicEvent } from "@/lib/note/economic-calendar/types";

/** Dedupe by stable id; later rows override earlier (fresher scrape wins). */
export function mergeEconomicEvents(...lists: EconomicEvent[][]): EconomicEvent[] {
  const map = new Map<string, EconomicEvent>();
  for (const list of lists) {
    for (const e of list) {
      map.set(e.id, e);
    }
  }
  return [...map.values()];
}
