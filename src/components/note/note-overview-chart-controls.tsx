"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NoteRangeCalendar } from "@/components/note/note-range-calendar";
import {
  addDays,
  formatRangeLabel,
  jakartaDateKey,
  rangeForPreset,
  rangeWithinSingleCalendarMonth,
  type EconDatePreset,
  type EconDateRange,
} from "@/lib/note/economic-calendar/date-range";
import { noteCopy } from "@/lib/note/copy";
import type { OverviewChartPrefs } from "@/lib/note/overview-chart-prefs";
import { saveOverviewChartPrefs } from "@/lib/note/overview-chart-prefs";
import type { PnlStackGranularity } from "@/lib/note/stats";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

type Props = {
  value: OverviewChartPrefs;
  onChange: (next: OverviewChartPrefs) => void;
};

export function NoteOverviewChartControls({ value, onChange }: Props) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState(value.range);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftRange(value.range);
  }, [value.range]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (next: OverviewChartPrefs) => {
    let patched = next;
    if (rangeWithinSingleCalendarMonth(next.range) && patched.granularity === "month") {
      patched = { ...patched, granularity: "day" };
    }
    onChange(patched);
    saveOverviewChartPrefs(patched);
  };

  const shiftDay = (delta: number) => {
    const span = value.range.from === value.range.to;
    const nextRange = span
      ? {
          preset: "custom" as const,
          from: addDays(value.range.from, delta),
          to: addDays(value.range.to, delta),
        }
      : {
          preset: "custom" as const,
          from: addDays(value.range.from, delta),
          to: addDays(value.range.to, delta),
        };
    commit({ ...value, range: nextRange });
  };

  const applyPreset = (preset: EconDatePreset) => {
    setDraftRange(rangeForPreset(preset, jakartaDateKey()));
  };

  const applyRange = () => {
    commit({ ...value, range: draftRange });
    setOpen(false);
  };

  const setGranularity = (granularity: PnlStackGranularity) => {
    commit({
      ...value,
      granularity,
      hideEmptyDays: granularity === "trade" ? false : value.hideEmptyDays,
    });
  };

  const pillLabel = formatRangeLabel(value.range, locale);
  const singleMonthRange = rangeWithinSingleCalendarMonth(value.range);
  const granLabels: Record<PnlStackGranularity, Record<"id" | "en", string>> = {
    month: { id: "Bulan", en: "Month" },
    day: { id: "Hari", en: "Day" },
    trade: { id: "Trade", en: "Trade" },
  };
  const granularityOptions = (["month", "day", "trade"] as const).filter(
    (g) => !(g === "month" && singleMonthRange)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex rounded-md border border-zinc-800 p-0.5"
          role="group"
          aria-label={locale === "en" ? "Chart granularity" : "Granularitas chart"}
        >
          {granularityOptions.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={value.granularity === g}
              onClick={() => setGranularity(g)}
              className={cn(
                "inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium",
                value.granularity === g ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {granLabels[g][locale]}
            </button>
          ))}
        </div>

        <div ref={rootRef} className="relative flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => shiftDay(-1)}
            aria-label={copy.econRangePrev}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftRange(value.range);
              setOpen((o) => !o);
            }}
            className={cn(
              "inline-flex min-h-11 max-w-[10rem] items-center gap-1 rounded-md border px-2 text-xs font-medium sm:max-w-none",
              open
                ? "note-surface-up-muted border"
                : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600"
            )}
          >
            <span className="truncate">{pillLabel}</span>
            <ChevronDown className={cn("size-3.5 shrink-0 text-zinc-400 transition", open && "rotate-180")} />
          </button>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => shiftDay(1)}
            aria-label={copy.econRangeNext}
          >
            <ChevronRight className="size-4" />
          </button>

          {open ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {copy.econRangeTitle}
              </p>
              <NoteRangeCalendar
                value={draftRange}
                onChange={(r) => setDraftRange({ ...draftRange, preset: "custom", from: r.from, to: r.to })}
                locale={locale}
                weekStart={prefs.weekStart}
              />
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800 pt-3">
                {(
                  [
                    ["today", copy.econRangeToday],
                    ["this_week", copy.econRangeThisWeek],
                    ["this_month", copy.econRangeThisMonth],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="inline-flex min-h-11 items-center text-xs text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-200"
                    onClick={() => applyPreset(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-900 hover:bg-white"
                  onClick={applyRange}
                >
                  {copy.econApplyFilter}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  {copy.batal}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {value.granularity !== "trade" ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            checked={value.hideEmptyDays}
            onChange={(e) => commit({ ...value, hideEmptyDays: e.target.checked })}
            className="size-4 rounded border-zinc-600 bg-zinc-900 accent-[var(--note-accent)]"
          />
          {locale === "en" ? "Hide days with no closes" : "Sembunyikan hari tanpa close"}
        </label>
      ) : null}
    </div>
  );
}
