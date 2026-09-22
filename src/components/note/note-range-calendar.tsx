"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import { cn } from "@/lib/utils";

export type NoteIsoRange = { from: string; to: string };

type Props = {
  value: NoteIsoRange;
  onChange: (next: NoteIsoRange) => void;
  locale?: "id" | "en";
  weekStart?: "sunday" | "monday";
};

function monthMatrix(year: number, monthIndex: number, weekStart: "sunday" | "monday"): (string | null)[][] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstDow = first.getUTCDay(); // 0 Sun
  const offset =
    weekStart === "monday" ? (firstDow === 0 ? 6 : firstDow - 1) : firstDow;

  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function inRange(iso: string, from: string, to: string): boolean {
  const a = from <= to ? from : to;
  const b = from <= to ? to : from;
  return iso >= a && iso <= b;
}

/** Single calendar: click start, then end. One control, no separate From/To fields. */
export function NoteRangeCalendar({
  value,
  onChange,
  locale = "id",
  weekStart = "sunday",
}: Props) {
  const today = jakartaDateKey();
  const seed = value.from || today;
  const [y, m] = seed.split("-").map(Number);
  const [cursor, setCursor] = useState({ year: y, month: m - 1 });
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const weeks = useMemo(
    () => monthMatrix(cursor.year, cursor.month, weekStart),
    [cursor.year, cursor.month, weekStart]
  );

  const previewFrom = anchor ?? value.from;
  const previewTo = anchor ? hover ?? anchor : value.to;

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1)).toLocaleDateString(
    locale === "en" ? "en-US" : "id-ID",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  const dow =
    weekStart === "monday"
      ? locale === "en"
        ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
        : ["Se", "Se", "Ra", "Ka", "Ju", "Sa", "Mi"]
      : locale === "en"
        ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
        : ["Mi", "Se", "Se", "Ra", "Ka", "Ju", "Sa"];

  const pick = (iso: string) => {
    if (!anchor) {
      setAnchor(iso);
      setHover(iso);
      onChange({ from: iso, to: iso });
      return;
    }
    const from = anchor <= iso ? anchor : iso;
    const to = anchor <= iso ? iso : anchor;
    onChange({ from, to });
    setAnchor(null);
    setHover(null);
  };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-9 coarse:size-11 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label={locale === "en" ? "Previous month" : "Bulan sebelumnya"}
          onClick={() =>
            setCursor((c) =>
              c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }
            )
          }
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-medium capitalize text-zinc-200">{monthLabel}</p>
        <button
          type="button"
          className="inline-flex size-9 coarse:size-11 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label={locale === "en" ? "Next month" : "Bulan berikutnya"}
          onClick={() =>
            setCursor((c) =>
              c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }
            )
          }
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase tracking-wide text-zinc-500">
        {dow.map((d, i) => (
          <span key={`${d}-${i}`} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {weeks.flatMap((row, ri) =>
          row.map((iso, ci) => {
            if (!iso) {
              return <span key={`e-${ri}-${ci}`} className="size-9" />;
            }
            const selected = inRange(iso, previewFrom, previewTo);
            const isStart = iso === (previewFrom <= previewTo ? previewFrom : previewTo);
            const isEnd = iso === (previewFrom <= previewTo ? previewTo : previewFrom);
            const isToday = iso === today;
            return (
              <button
                key={iso}
                type="button"
                onMouseEnter={() => anchor && setHover(iso)}
                onFocus={() => anchor && setHover(iso)}
                onClick={() => pick(iso)}
                className={cn(
                  "relative inline-flex size-9 coarse:size-11 items-center justify-center rounded-md text-xs tabular-nums transition-colors",
                  selected ? "bg-zinc-100 text-zinc-950" : "text-zinc-300 hover:bg-zinc-800",
                  !selected && isToday && "ring-1 ring-zinc-600",
                  (isStart || isEnd) && selected && "font-semibold"
                )}
              >
                {Number(iso.slice(8))}
              </button>
            );
          })
        )}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-zinc-500">
        {anchor
          ? locale === "en"
            ? "Click the end date to finish the range."
            : "Klik tanggal akhir untuk menyelesaikan rentang."
          : locale === "en"
            ? "Click start, then end. Same day = single day."
            : "Klik awal, lalu akhir. Hari sama = satu hari."}
      </p>
      <button
        type="button"
        className="mt-1 text-[11px] text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-200"
        onClick={() => {
          const day = today;
          onChange({ from: day, to: day });
          setAnchor(null);
          setHover(null);
          const [ty, tm] = day.split("-").map(Number);
          setCursor({ year: ty, month: tm - 1 });
        }}
      >
        {locale === "en" ? "Jump to today" : "Lompat ke hari ini"}
      </button>
    </div>
  );
}
