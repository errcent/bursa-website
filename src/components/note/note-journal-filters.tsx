"use client";

import { useState } from "react";

import { NoteRangeCalendar } from "@/components/note/note-range-calendar";
import type { JournalFilterOpts, ResultFilter } from "@/lib/note/stats";
import { cn } from "@/lib/utils";

type Props = {
  locale: "id" | "en";
  value: JournalFilterOpts;
  symbols: string[];
  onChange: (next: JournalFilterOpts) => void;
  weekStart?: "sunday" | "monday";
};

export function NoteJournalFilters({ locale, value, symbols, onChange, weekStart = "sunday" }: Props) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);
  const [calOpen, setCalOpen] = useState(false);

  const rangeLabel =
    value.dateFrom && value.dateTo
      ? value.dateFrom === value.dateTo
        ? value.dateFrom
        : `${value.dateFrom} → ${value.dateTo}`
      : t("Semua tanggal", "All dates");

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
      <label className="text-xs text-zinc-400">
        {t("Simbol", "Symbol")}
        <select
          className="note-field mt-1 block min-w-[7rem]"
          value={value.symbol ?? ""}
          onChange={(e) => onChange({ ...value, symbol: e.target.value || null })}
        >
          <option value="">{t("Semua", "All")}</option>
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-zinc-400">
        {t("Hasil", "Result")}
        <select
          className="note-field mt-1 block min-w-[6rem]"
          value={value.result}
          onChange={(e) => onChange({ ...value, result: e.target.value as ResultFilter })}
        >
          <option value="ALL">{t("Semua", "All")}</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="be">BE</option>
          <option value="open">Open</option>
        </select>
      </label>
      <label className="text-xs text-zinc-400">
        {t("Sisi", "Side")}
        <select
          className="note-field mt-1 block min-w-[5rem]"
          value={value.side ?? ""}
          onChange={(e) => onChange({ ...value, side: e.target.value || null })}
        >
          <option value="">{t("Semua", "All")}</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </label>

      <div className="relative">
        <p className="text-xs text-zinc-400">{t("Rentang", "Range")}</p>
        <button
          type="button"
          onClick={() => setCalOpen((o) => !o)}
          className={cn(
            "note-field mt-1 inline-flex min-h-9 coarse:min-h-11 min-w-[11rem] items-center justify-between gap-2 px-2 text-left text-xs",
            calOpen && "border-zinc-500"
          )}
        >
          <span className="truncate tabular-nums text-zinc-200">{rangeLabel}</span>
        </button>
        {calOpen ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-[18.5rem] rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
            <NoteRangeCalendar
              value={{
                from: value.dateFrom ?? value.dateTo ?? new Date().toISOString().slice(0, 10),
                to: value.dateTo ?? value.dateFrom ?? new Date().toISOString().slice(0, 10),
              }}
              onChange={(r) =>
                onChange({
                  ...value,
                  dateFrom: r.from,
                  dateTo: r.to,
                  date: r.from === r.to ? r.from : value.date,
                })
              }
              locale={locale}
              weekStart={weekStart}
            />
            <div className="mt-2 flex gap-2 border-t border-zinc-800 pt-2">
              <button
                type="button"
                className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-900"
                onClick={() => setCalOpen(false)}
              >
                {t("Selesai", "Done")}
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 coarse:min-h-11 items-center text-xs text-zinc-400 hover:text-zinc-200"
                onClick={() => {
                  onChange({ ...value, dateFrom: null, dateTo: null, date: null });
                  setCalOpen(false);
                }}
              >
                {t("Hapus rentang", "Clear range")}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {(value.symbol || value.side || value.dateFrom || value.dateTo || value.result !== "ALL") && (
        <button
          type="button"
          className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={() =>
            onChange({
              kind: value.kind,
              result: "ALL",
              date: null,
              dateFrom: null,
              dateTo: null,
              symbol: null,
              side: null,
            })
          }
        >
          {t("Reset", "Reset")}
        </button>
      )}
    </div>
  );
}
