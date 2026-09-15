"use client";

import { ExternalLink, Folder } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import type { EconomicEvent } from "@/lib/note/economic-calendar/types";
import { cn } from "@/lib/utils";

const IMPACT_ICON: Record<string, string> = {
  high: "note-impact-high note-impact-high-fill",
  medium: "note-impact-medium note-impact-medium-fill",
  low: "note-impact-low note-impact-low-fill",
  holiday: "text-violet-400 fill-violet-400/20",
  unknown: "text-zinc-500 fill-zinc-500/15",
};

export type EconTableColumnLabels = {
  date: string;
  time: string;
  currency: string;
  impact: string;
  event: string;
  detail: string;
  actual: string;
  forecast: string;
  previous: string;
};

type FlatRow = {
  event: EconomicEvent;
  showDate: boolean;
  dateSpan: number;
  showTime: boolean;
  timeSpan: number;
  timeGroupStart: boolean;
};

function parseMetric(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  const m = cleaned.match(/^([+-]?[\d.]+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** FF-style: green beat forecast, red miss (numeric only). */
export function actualTone(
  actual: string | null,
  forecast: string | null
): "up" | "down" | "neutral" | null {
  const a = parseMetric(actual);
  const f = parseMetric(forecast);
  if (a == null || f == null) return null;
  if (a > f) return "up";
  if (a < f) return "down";
  return "neutral";
}

function formatDateCell(dateIso: string, locale: "id" | "en"): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function flattenForTable(events: EconomicEvent[]): FlatRow[] {
  const sorted = [...events].sort((a, b) => {
    const da = `${a.date}T${a.timeLabel}`;
    const db = `${b.date}T${b.timeLabel}`;
    return da.localeCompare(db) || a.title.localeCompare(b.title);
  });

  const out: FlatRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    const date = sorted[i].date;
    const dateEnd = sorted.findIndex((e, idx) => idx > i && e.date !== date);
    const dateCount = (dateEnd === -1 ? sorted.length : dateEnd) - i;

    let j = i;
    while (j < i + dateCount) {
      const time = sorted[j].timeLabel;
      let k = j;
      while (k < i + dateCount && sorted[k].timeLabel === time) k += 1;
      const timeCount = k - j;
      for (let t = j; t < k; t += 1) {
        out.push({
          event: sorted[t],
          showDate: t === i,
          dateSpan: dateCount,
          showTime: t === j,
          timeSpan: timeCount,
          timeGroupStart: t === j,
        });
      }
      j = k;
    }
    i += dateCount;
  }
  return out;
}

function ImpactIcon({ impact }: { impact: string }) {
  return (
    <Folder
      className={cn("mx-auto size-[18px]", IMPACT_ICON[impact] ?? IMPACT_ICON.unknown)}
      aria-hidden
    />
  );
}

export function EconomicCalendarTable({
  events,
  locale,
  labels,
  nearestEventId,
  countdownLabel,
  onUpNext,
  filterSlot,
}: {
  events: EconomicEvent[];
  locale: "id" | "en";
  labels: EconTableColumnLabels;
  nearestEventId?: string | null;
  countdownLabel?: string | null;
  onUpNext?: () => void;
  filterSlot?: ReactNode;
}) {
  const rows = useMemo(() => flattenForTable(events), [events]);

  const toolbarDate = useMemo(() => {
    if (!events.length) return null;
    const today = new Date().toISOString().slice(0, 10);
    const hit = events.find((e) => e.date === today);
    return formatDateCell(hit?.date ?? events[0].date, locale);
  }, [events, locale]);

  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-md border border-zinc-600/50 bg-zinc-950/50 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-600/60 bg-zinc-800 px-3 py-2.5">
        <p className="text-xs font-semibold text-zinc-100">
          {locale === "en" ? "Today" : "Hari ini"}
          {toolbarDate ? `: ${toolbarDate}` : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {nearestEventId && onUpNext ? (
            <button
              type="button"
              onClick={onUpNext}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300"
            >
              {locale === "en" ? "Up Next" : "Berikutnya"}
            </button>
          ) : null}
          {filterSlot}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-zinc-600/70 bg-zinc-800/95 text-[10px] font-bold uppercase tracking-wide text-zinc-200">
              <th className="whitespace-nowrap border-r border-zinc-700/60 px-2 py-2.5 pl-3">{labels.date}</th>
              <th className="whitespace-nowrap border-r border-zinc-700/40 px-2 py-2.5">{labels.time}</th>
              <th className="whitespace-nowrap px-2 py-2.5">{labels.currency}</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-center">{labels.impact}</th>
              <th className="min-w-[14rem] px-2 py-2.5">{labels.event}</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-center">{labels.detail}</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{labels.actual}</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{labels.forecast}</th>
              <th className="whitespace-nowrap px-2 py-2.5 pr-3 text-right tabular-nums">{labels.previous}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ event, showDate, dateSpan, showTime, timeSpan, timeGroupStart }) => {
              const tone = actualTone(event.actual, event.forecast);
              const highlight = event.id === nearestEventId;
              const tentative = /tentative|tbd|all day|day/i.test(event.timeLabel);

              return (
                <tr
                  key={event.id}
                  id={`econ-row-${event.id}`}
                  className={cn(
                    "border-b border-zinc-700/45",
                    highlight && "note-row-warn",
                    !highlight && "even:bg-zinc-900/25 odd:bg-zinc-950/20",
                    timeGroupStart && "border-t border-zinc-600/35"
                  )}
                >
                  {showDate ? (
                    <td
                      rowSpan={dateSpan}
                      className="align-top border-r border-zinc-700/55 bg-zinc-900/30 px-2 py-2.5 pl-3 text-[11px] font-semibold leading-snug text-zinc-200"
                    >
                      {formatDateCell(event.date, locale)}
                    </td>
                  ) : null}
                  {showTime ? (
                    <td
                      rowSpan={timeSpan}
                      className="align-top border-r border-zinc-700/40 px-2 py-2.5 tabular-nums text-zinc-300"
                    >
                      {tentative ? (
                        <span className="note-pnl-up opacity-90">{locale === "en" ? "Tentative" : "Tentatif"}</span>
                      ) : (
                        event.timeLabel || "-"
                      )}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap border-r border-zinc-800/40 px-2 py-2 font-semibold text-zinc-100">
                    {event.currency}
                  </td>
                  <td className="border-r border-zinc-800/40 px-2 py-2 text-center">
                    <span className="inline-flex justify-center" title={event.impact}>
                      <ImpactIcon impact={event.impact} />
                    </span>
                  </td>
                  <td className="border-r border-zinc-800/40 px-2 py-2">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="leading-snug text-zinc-50">{event.title}</span>
                      {highlight && countdownLabel ? (
                        <span className="note-pill-warn w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
                          {countdownLabel}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="border-r border-zinc-800/40 px-2 py-2 text-center">
                    {event.url ? (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        aria-label="Forex Factory"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "border-r border-zinc-800/40 px-2 py-2 text-right tabular-nums font-bold",
                      tone === "up" && "note-pnl-up",
                      tone === "down" && "note-pnl-down",
                      tone === "neutral" && "text-zinc-100",
                      tone == null && "text-zinc-500"
                    )}
                  >
                    {event.actual?.trim() || ""}
                  </td>
                  <td className="border-r border-zinc-800/40 px-2 py-2 text-right tabular-nums text-zinc-400">
                    {event.forecast?.trim() || ""}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 pr-3 text-right tabular-nums text-zinc-400">
                    {event.previous?.trim() || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
