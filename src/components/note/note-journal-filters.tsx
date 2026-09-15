"use client";

import type { JournalFilterOpts, ResultFilter } from "@/lib/note/stats";

type Props = {
  locale: "id" | "en";
  value: JournalFilterOpts;
  symbols: string[];
  onChange: (next: JournalFilterOpts) => void;
};

export function NoteJournalFilters({ locale, value, symbols, onChange }: Props) {
  const t = (id: string, en: string) => (locale === "en" ? en : id);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
      <label className="text-[11px] text-zinc-500">
        {t("Simbol", "Symbol")}
        <select
          className="mt-1 block min-w-[7rem] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
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
      <label className="text-[11px] text-zinc-500">
        {t("Hasil", "Result")}
        <select
          className="mt-1 block min-w-[6rem] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
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
      <label className="text-[11px] text-zinc-500">
        {t("Sisi", "Side")}
        <select
          className="mt-1 block min-w-[5rem] rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          value={value.side ?? ""}
          onChange={(e) => onChange({ ...value, side: e.target.value || null })}
        >
          <option value="">{t("Semua", "All")}</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </label>
      <label className="text-[11px] text-zinc-500">
        {t("Dari", "From")}
        <input
          type="date"
          className="mt-1 block rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          value={value.dateFrom ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              dateFrom: e.target.value || null,
              date: e.target.value && value.dateTo === value.dateFrom ? e.target.value : value.date,
            })
          }
        />
      </label>
      <label className="text-[11px] text-zinc-500">
        {t("Sampai", "To")}
        <input
          type="date"
          className="mt-1 block rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          value={value.dateTo ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              dateTo: e.target.value || null,
              date: e.target.value && value.dateFrom === value.dateTo ? e.target.value : value.date,
            })
          }
        />
      </label>
      {(value.symbol || value.side || value.dateFrom || value.dateTo || value.result !== "ALL") && (
        <button
          type="button"
          className="rounded-md border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
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
