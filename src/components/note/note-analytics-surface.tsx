"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import {
  buildAnalyticsSurfaceGrid,
  type SurfaceAxisId,
  type SurfaceMetricId,
  type SurfaceRowId,
} from "@/lib/note/analytics/surface-grid";
import {
  addDays,
  jakartaDateKey,
  rangeForPreset,
} from "@/lib/note/economic-calendar/date-range";
import type { JournalEntry } from "@/lib/note/types";

const NoteAnalyticsSurfacePlot = dynamic(
  () => import("@/components/note/note-analytics-surface-plot").then((m) => m.NoteAnalyticsSurfacePlot),
  {
    ssr: false,
    loading: () => <div className="flex h-[360px] items-center justify-center text-sm text-zinc-500">…</div>,
  }
);

type Props = {
  entries: JournalEntry[];
  locale: "id" | "en";
};

type SurfaceRangePreset = "this_month" | "last_30" | "last_90" | "ytd";

function surfaceRangeForPreset(preset: SurfaceRangePreset, anchor = jakartaDateKey()) {
  if (preset === "this_month") {
    const r = rangeForPreset("this_month", anchor);
    return { from: r.from, to: r.to };
  }
  if (preset === "last_30") return { from: addDays(anchor, -29), to: anchor };
  if (preset === "last_90") return { from: addDays(anchor, -89), to: anchor };
  const y = anchor.slice(0, 4);
  return { from: `${y}-01-01`, to: anchor };
}

export function NoteAnalyticsSurface({ entries, locale }: Props) {
  const [xAxis, setXAxis] = useState<SurfaceAxisId>("session");
  const [yAxis, setYAxis] = useState<SurfaceRowId>("symbol");
  const [metric, setMetric] = useState<SurfaceMetricId>("win_rate");
  const [rangePreset, setRangePreset] = useState<SurfaceRangePreset>("this_month");
  const [includeBe, setIncludeBe] = useState(true);
  const [minCellCount, setMinCellCount] = useState<1 | 2 | 3>(1);
  const [topRows, setTopRows] = useState(8);

  const range = useMemo(() => surfaceRangeForPreset(rangePreset, jakartaDateKey()), [rangePreset]);

  const grid = useMemo(
    () =>
      buildAnalyticsSurfaceGrid({
        entries,
        xAxis,
        yAxis,
        metric,
        from: range.from,
        to: range.to,
        includeBe,
        minCellCount,
        topRows,
        locale,
      }),
    [entries, xAxis, yAxis, metric, range, includeBe, minCellCount, topRows, locale]
  );

  const labels = {
    title: locale === "en" ? "Context surface" : "Surface konteks",
    hint:
      locale === "en"
        ? "Drag to rotate · scroll to zoom · two context axes + one metric on Z."
        : "Drag putar · scroll zoom · dua sumbu konteks + metrik di Z.",
    x: locale === "en" ? "X axis" : "Sumbu X",
    y: locale === "en" ? "Y axis (top N)" : "Sumbu Y (top N)",
    z: locale === "en" ? "Height (Z)" : "Tinggi (Z)",
    range: locale === "en" ? "Range" : "Rentang",
    minCell: locale === "en" ? "Min closes / cell" : "Min close / sel",
    topN: locale === "en" ? "Row buckets" : "Baris (top)",
    be: locale === "en" ? "Include BE" : "Sertakan BE",
    presets: {
      this_month: locale === "en" ? "This month" : "Bulan ini",
      last_30: locale === "en" ? "Last 30d" : "30 hari",
      last_90: locale === "en" ? "Last 90d" : "90 hari",
      ytd: locale === "en" ? "YTD" : "YTD",
    } satisfies Record<SurfaceRangePreset, string>,
    dims: {
      session: locale === "en" ? "Session" : "Sesi",
      weekday: locale === "en" ? "Weekday" : "Hari",
      hour_wib: locale === "en" ? "Hour block" : "Blok jam",
      side: locale === "en" ? "Side" : "Sisi",
      symbol: locale === "en" ? "Symbol" : "Simbol",
      asset: locale === "en" ? "Asset class" : "Kelas aset",
    },
    metrics: {
      win_rate: locale === "en" ? "Win rate %" : "Win rate %",
      net_pnl: locale === "en" ? "Net PnL" : "Net PnL",
      avg_pnl: locale === "en" ? "Avg PnL" : "PnL rata-rata",
      count: locale === "en" ? "Close count" : "Jumlah close",
    },
  };

  const rowOptions: SurfaceRowId[] = ["symbol", "asset", "session", "side"];
  const xOptions: SurfaceAxisId[] = ["session", "weekday", "hour_wib", "side"];

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">{labels.hint}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] text-zinc-500">
          {labels.x}
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value as SurfaceAxisId)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          >
            {xOptions.map((id) => (
              <option key={id} value={id}>
                {labels.dims[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-zinc-500">
          {labels.y}
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value as SurfaceRowId)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          >
            {rowOptions.map((id) => (
              <option key={id} value={id} disabled={id === "session" && xAxis === "session"}>
                {labels.dims[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-zinc-500">
          {labels.z}
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as SurfaceMetricId)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          >
            {(Object.keys(labels.metrics) as SurfaceMetricId[]).map((id) => (
              <option key={id} value={id}>
                {labels.metrics[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-zinc-500">
          {labels.range}
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value as SurfaceRangePreset)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
          >
            {(["this_month", "last_30", "last_90", "ytd"] as const).map((p) => (
              <option key={p} value={p}>
                {labels.presets[p]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={includeBe}
            onChange={(e) => setIncludeBe(e.target.checked)}
            className="size-3.5 rounded border-zinc-600 bg-zinc-900 accent-[var(--chart-info-strong)]"
          />
          {labels.be}
        </label>
        <label className="flex items-center gap-2">
          {labels.minCell}
          <select
            value={minCellCount}
            onChange={(e) => setMinCellCount(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          {labels.topN}
          <select
            value={topRows}
            onChange={(e) => setTopRows(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          >
            {[5, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="tabular-nums text-zinc-500">
          {grid.filteredCount} close · {range.from} → {range.to}
        </span>
      </div>

      {grid.empty ? (
        <p className="text-sm text-zinc-500">
          {locale === "en"
            ? "Not enough closed trades in this range for a surface. Log more or widen the range."
            : "Close di rentang ini belum cukup untuk surface. Tambah log atau lebarkan rentang."}
        </p>
      ) : (
        <NoteAnalyticsSurfacePlot grid={grid} metric={metric} locale={locale} />
      )}
    </div>
  );
}
