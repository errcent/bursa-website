import { createHash } from "node:crypto";

import { classifyEventType } from "@/lib/note/economic-calendar/event-type";
import { startsAtFromDateAndTimeLabel } from "@/lib/note/economic-calendar/event-datetime";
import type { EconomicEvent, EconomicImpact } from "@/lib/note/economic-calendar/types";

function readTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i").exec(block);
  if (cdata) return cdata[1].trim();
  const plain = new RegExp(`<${tag}>([^<]*)</${tag}>`, "i").exec(block);
  return (plain?.[1] ?? "").trim();
}

function normalizeImpact(raw: string): EconomicImpact {
  const v = raw.toLowerCase();
  if (v.includes("high")) return "high";
  if (v.includes("medium") || v.includes("med")) return "medium";
  if (v.includes("low")) return "low";
  if (v.includes("holiday")) return "holiday";
  return "unknown";
}

/** MM-DD-YYYY → YYYY-MM-DD */
export function ffDateToIso(raw: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw.trim());
  if (!m) return raw;
  return `${m[3]}-${m[1]}-${m[2]}`;
}

export function parseForexFactoryXml(xml: string): EconomicEvent[] {
  const blocks = xml.match(/<event>[\s\S]*?<\/event>/gi) ?? [];
  const out: EconomicEvent[] = [];

  for (const block of blocks) {
    const title = readTag(block, "title");
    if (!title) continue;
    const country = readTag(block, "country") || "-";
    const date = ffDateToIso(readTag(block, "date"));
    const timeLabel = readTag(block, "time") || "-";
    const impact = normalizeImpact(readTag(block, "impact"));
    const forecast = readTag(block, "forecast") || null;
    const previous = readTag(block, "previous") || null;
    const url = readTag(block, "url") || null;
    const id = createHash("sha1")
      .update(`${date}|${timeLabel}|${title}|${country}`)
      .digest("hex")
      .slice(0, 12);

    out.push({
      id,
      title,
      currency: country,
      date,
      timeLabel,
      startsAt: startsAtFromDateAndTimeLabel(date, timeLabel),
      impact,
      eventType: classifyEventType(title),
      forecast,
      previous,
      actual: null,
      url,
      source: "forexfactory_xml",
    });
  }

  return out;
}
