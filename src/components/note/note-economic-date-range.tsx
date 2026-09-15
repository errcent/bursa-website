"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  addDays,
  defaultEconDateRange,
  formatRangeLabel,
  jakartaDateKey,
  loadEconDateRange,
  rangeForPreset,
  saveEconDateRange,
  type EconDatePreset,
  type EconDateRange,
} from "@/lib/note/economic-calendar/date-range";
import { noteCopy } from "@/lib/note/copy";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

type Props = {
  value: EconDateRange;
  onChange: (next: EconDateRange) => void;
};

export function NoteEconomicDateRange({ value, onChange }: Props) {
  const [prefs] = useNotePrefs();
  const copy = noteCopy(prefs.locale);
  const locale = prefs.locale;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shiftDay = (delta: number) => {
    const span = value.from === value.to ? 1 : null;
    if (span) {
      const day = addDays(value.from, delta);
      const next = { preset: "custom" as const, from: day, to: day };
      onChange(next);
      saveEconDateRange(next);
      return;
    }
    const days = Math.round((Date.parse(value.to) - Date.parse(value.from)) / 86400000) + 1;
    const next = {
      preset: "custom" as const,
      from: addDays(value.from, delta),
      to: addDays(value.to, delta),
    };
    if (days === 7) next.preset = "custom";
    onChange(next);
    saveEconDateRange(next);
  };

  const applyPreset = (preset: EconDatePreset) => {
    const next = rangeForPreset(preset, jakartaDateKey());
    setDraft(next);
  };

  const apply = () => {
    onChange(draft);
    saveEconDateRange(draft);
    setOpen(false);
  };

  const resetToday = () => {
    const next = defaultEconDateRange();
    onChange(next);
    saveEconDateRange(next);
    setDraft(next);
    setOpen(false);
  };

  const todayKey = jakartaDateKey();
  const pillLabel =
    value.from === value.to && value.from === todayKey
      ? formatRangeLabel(value, locale)
      : formatRangeLabel(
          value.from === value.to ? { ...value, preset: "custom" } : value,
          locale
        );

  return (
    <div ref={rootRef} className="relative flex items-center gap-0.5">
      <button
        type="button"
        className="inline-flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        onClick={() => shiftDay(-1)}
        aria-label={copy.econRangePrev}
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen((o) => !o);
        }}
        className={cn(
          "inline-flex max-w-[11rem] items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium sm:max-w-none",
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
        className="inline-flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        onClick={() => shiftDay(1)}
        aria-label={copy.econRangeNext}
      >
        <ChevronRight className="size-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{copy.econRangeTitle}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-[10px] text-zinc-500">
              {copy.econRangeFrom}
              <input
                type="date"
                value={draft.from}
                onChange={(e) => setDraft((d) => ({ ...d, preset: "custom", from: e.target.value }))}
                className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
            </label>
            <label className="text-[10px] text-zinc-500">
              {copy.econRangeTo}
              <input
                type="date"
                value={draft.to}
                onChange={(e) => setDraft((d) => ({ ...d, preset: "custom", to: e.target.value }))}
                className="mt-0.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800 pt-3">
            {(
              [
                ["today", copy.econRangeToday],
                ["this_week", copy.econRangeThisWeek],
                ["next_week", copy.econRangeNextWeek],
                ["this_month", copy.econRangeThisMonth],
                ["next_month", copy.econRangeNextMonth],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="text-xs text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-200"
                onClick={() => applyPreset(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white"
              onClick={apply}
            >
              {copy.econApplyFilter}
            </button>
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setDraft(value);
                setOpen(false);
              }}
            >
              {copy.batal}
            </button>
            <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300" onClick={resetToday}>
              {copy.econRangeResetToday}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function useEconDateRange(): [EconDateRange, (r: EconDateRange) => void] {
  const [range, setRange] = useState<EconDateRange>(defaultEconDateRange());
  useEffect(() => {
    setRange(loadEconDateRange());
  }, []);
  return [range, setRange];
}
