import { createHash } from "node:crypto";

import { classifyEventType } from "@/lib/note/economic-calendar/event-type";
import { startsAtFromIsoField } from "@/lib/note/economic-calendar/event-datetime";
import { ffDateToIso } from "@/lib/note/economic-calendar/parse-ff-xml";
import type { EconomicEvent, EconomicImpact } from "@/lib/note/economic-calendar/types";

function normalizeImpact(raw: string): EconomicImpact {
  const v = raw.toLowerCase();
  if (v.includes("high")) return "high";
  if (v.includes("medium") || v.includes("med")) return "medium";
  if (v.includes("low")) return "low";
  if (v.includes("holiday")) return "holiday";
  return "unknown";
}

function isoDateFromFfJson(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return ffDateToIso(trimmed);
}

function timeLabelFromIso(raw: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(raw);
  if (!m) return "-";
  const h = Number(m[1]);
  const min = m[2];
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${min}${suffix}`;
}

type FfJsonRow = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  url?: string;
};

export function parseForexFactoryJson(rows: unknown): EconomicEvent[] {
  if (!Array.isArray(rows)) return [];
  const out: EconomicEvent[] = [];

  for (const row of rows) {
    const r = row as FfJsonRow;
    const title = String(r.title ?? "").trim();
    if (!title) continue;
    const country = String(r.country ?? "-");
    const dateRaw = String(r.date ?? "");
    const date = isoDateFromFfJson(dateRaw);
    const startsAt = dateRaw.includes("T") ? startsAtFromIsoField(dateRaw) : null;
    const timeLabel = dateRaw.includes("T") ? timeLabelFromIso(dateRaw) : "-";
    const impact = normalizeImpact(String(r.impact ?? ""));
    const forecast = r.forecast != null && String(r.forecast).trim() ? String(r.forecast).trim() : null;
    const previous = r.previous != null && String(r.previous).trim() ? String(r.previous).trim() : null;
    const actual = r.actual != null && String(r.actual).trim() ? String(r.actual).trim() : null;
    const url = r.url != null && String(r.url).trim() ? String(r.url).trim() : null;
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
      startsAt,
      impact,
      forecast,
      previous,
      actual,
      url,
      source: "forexfactory_json",
      eventType: classifyEventType(title),
    });
  }

  return out;
}
