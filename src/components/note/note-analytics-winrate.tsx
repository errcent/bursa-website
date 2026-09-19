"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import { groupBySymbol, outcomePercentages } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
  locale: "id" | "en";
};

type BarRow = {
  symbol: string;
  closed: number;
  wins: number;
  losses: number;
  be: number;
  winPct: number;
  lossPct: number;
  bePct: number;
  winRate: number | null;
};

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  fontSize: 12,
};

function roundPct(n: number) {
  return Math.round(n * 10) / 10;
}

export function NoteAnalyticsWinrate({ entries, locale }: Props) {
  const symbols = useMemo(() => groupBySymbol(entries).filter((s) => s.closed > 0), [entries]);
  const [instrument, setInstrument] = useState<string>("ALL");
  const [includeBe, setIncludeBe] = useState(true);

  const activeRows = useMemo(() => {
    if (instrument === "ALL") return symbols;
    return symbols.filter((s) => s.key === instrument);
  }, [symbols, instrument]);

  const totals = useMemo(() => {
    return activeRows.reduce(
      (acc, r) => ({
        wins: acc.wins + r.wins,
        losses: acc.losses + r.losses,
        be: acc.be + r.be,
        closed: acc.closed + r.closed,
      }),
      { wins: 0, losses: 0, be: 0, closed: 0 }
    );
  }, [activeRows]);

  const overall = useMemo(() => {
    const mix = outcomePercentages(totals.wins, totals.losses, totals.be, includeBe);
    return mix.winRate;
  }, [totals, includeBe]);

  const showPie = activeRows.length === 1;
  const pieRow = activeRows[0];

  const pieData = useMemo(() => {
    if (!pieRow || pieRow.closed <= 0) return [];
    const slices = [
      {
        name: locale === "en" ? "Wins" : "Menang",
        value: pieRow.wins,
        fill: NOTE_CHART_COLORS.upStrong,
      },
      {
        name: locale === "en" ? "Breakeven" : "Breakeven",
        value: includeBe ? pieRow.be : 0,
        fill: NOTE_CHART_COLORS.infoStrong,
      },
      {
        name: locale === "en" ? "Losses" : "Rugi",
        value: pieRow.losses,
        fill: NOTE_CHART_COLORS.downStrong,
      },
    ];
    return slices.filter((d) => d.value > 0);
  }, [pieRow, includeBe, locale]);

  const barData: BarRow[] = useMemo(() => {
    return activeRows
      .map((r) => {
        const mix = outcomePercentages(r.wins, r.losses, r.be, includeBe);
        return {
          symbol: r.key,
          closed: r.closed,
          wins: r.wins,
          losses: r.losses,
          be: r.be,
          winPct: roundPct(mix.winPct),
          lossPct: roundPct(mix.lossPct),
          bePct: roundPct(mix.bePct),
          winRate: mix.winRate,
        };
      })
      .filter((r) => r.winPct + r.lossPct + r.bePct > 0)
      .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
  }, [activeRows, includeBe]);

  if (!symbols.length) {
    return (
      <p className="text-sm text-zinc-400">
        {locale === "en" ? "Log closed trades to see win rate." : "Log trade close untuk lihat win rate."}
      </p>
    );
  }

  const labels = {
    instrument: locale === "en" ? "Instrument" : "Instrumen",
    all: locale === "en" ? "All" : "Semua",
    showBe: locale === "en" ? "Include breakeven (BE)" : "Sertakan breakeven (BE)",
    wins: locale === "en" ? "Wins" : "Menang",
    losses: locale === "en" ? "Losses" : "Rugi",
    be: "BE",
    mix: locale === "en" ? "Outcome mix" : "Campuran hasil",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            {locale === "en" ? "Win rate" : "Win rate"}
          </p>
          <p className="font-heading text-2xl tabular-nums text-zinc-100">
            {overall == null ? "-" : `${roundPct(overall * 100)}%`}
          </p>
          {totals.be > 0 && !includeBe ? (
            <p className="mt-0.5 text-xs text-[var(--chart-info-soft)]">
              {locale === "en"
                ? `${totals.be} BE excluded from rate`
                : `${totals.be} BE tidak masuk perhitungan`}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={includeBe}
              onChange={(e) => setIncludeBe(e.target.checked)}
              className="size-4 rounded border-zinc-600 bg-zinc-900 accent-[var(--chart-info-strong)]"
            />
            {labels.showBe}
          </label>
          <label className="text-xs text-zinc-400">
            {labels.instrument}
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="note-field mt-1 block min-w-[8rem]"
            >
              <option value="ALL">{labels.all}</option>
              {symbols.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.key} ({s.closed})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--chart-up-strong)]" aria-hidden />
          {labels.wins}
        </span>
        {includeBe ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-[var(--chart-info-strong)]" aria-hidden />
            {labels.be}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[var(--chart-down-strong)]" aria-hidden />
          {labels.losses}
        </span>
        {!showPie && barData.length ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-[var(--chart-track)]" aria-hidden />
            {locale === "en" ? "100% closes" : "100% close"}
          </span>
        ) : null}
      </div>

      {showPie && pieData.length ? (
        <div className="h-[220px] w-full">
          <p className="mb-2 text-xs text-zinc-400">
            {pieRow?.key} · {pieRow?.closed} close
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : barData.length ? (
        <div className={cn("w-full", barData.length > 4 ? "h-[280px]" : "h-[220px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} unit="%" />
              <YAxis
                type="category"
                dataKey="symbol"
                width={72}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: NOTE_CHART_COLORS.track }}
                contentStyle={tooltipStyle}
                labelFormatter={(symbol) => String(symbol)}
                formatter={(_value, name, item) => {
                  const row = item.payload as BarRow;
                  const key = String(name);
                  if (key === "winPct") {
                    return [`${row.wins} · ${row.winPct}%`, labels.wins];
                  }
                  if (key === "bePct") {
                    return [`${row.be} · ${row.bePct}%`, labels.be];
                  }
                  if (key === "lossPct") {
                    return [`${row.losses} · ${row.lossPct}%`, labels.losses];
                  }
                  return [String(_value), labels.mix];
                }}
              />
              <Bar
                dataKey="winPct"
                stackId="outcome"
                fill={NOTE_CHART_COLORS.upStrong}
                maxBarSize={22}
                background={{ fill: NOTE_CHART_COLORS.track, radius: 4 }}
              />
              {includeBe ? (
                <Bar dataKey="bePct" stackId="outcome" fill={NOTE_CHART_COLORS.infoStrong} maxBarSize={22} />
              ) : null}
              <Bar
                dataKey="lossPct"
                stackId="outcome"
                fill={NOTE_CHART_COLORS.downStrong}
                maxBarSize={22}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
