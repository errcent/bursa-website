"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import { jakartaDateKey } from "@/lib/note/economic-calendar/date-range";
import {
  groupByWeekday,
  outcomePercentages,
  weekdayLabels,
  weekdayOrder,
  type WeekStart,
} from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
  locale: "id" | "en";
  weekStart: WeekStart;
};

type Row = {
  weekday: number;
  label: string;
  closed: number;
  wins: number;
  losses: number;
  be: number;
  winPct: number;
  lossPct: number;
  bePct: number;
  winRatePct: number | null;
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

function peakLabel(rows: Row[], pick: (r: Row) => number) {
  const best = rows.reduce((a, b) => (pick(b) > pick(a) ? b : a), rows[0]!);
  if (!best || pick(best) <= 0) return null;
  return best.label;
}

export function NoteAnalyticsWinrateWeekday({ entries, locale, weekStart }: Props) {
  const [rangeDays, setRangeDays] = useState<30 | 90 | 0>(90);
  const [includeBe, setIncludeBe] = useState(true);

  const anchor = jakartaDateKey();
  const from = useMemo(() => {
    if (rangeDays === 0) return null;
    const [y, m, d] = anchor.split("-").map(Number);
    const dt = new Date(Date.UTC(y!, m! - 1, d! - (rangeDays - 1)));
    return dt.toISOString().slice(0, 10);
  }, [anchor, rangeDays]);

  const labels = weekdayLabels(weekStart, locale);
  const order = weekdayOrder(weekStart);

  const barData: Row[] = useMemo(() => {
    const buckets = groupByWeekday(entries, { from: from ?? undefined, to: anchor });
    return order.map((weekday, displayIdx) => {
      const b = buckets[weekday]!;
      const mix = outcomePercentages(b.wins, b.losses, b.be, includeBe);
      return {
        weekday,
        label: labels[displayIdx] ?? String(weekday),
        closed: b.closed,
        wins: b.wins,
        losses: b.losses,
        be: b.be,
        winPct: roundPct(mix.winPct),
        lossPct: roundPct(mix.lossPct),
        bePct: roundPct(mix.bePct),
        winRatePct: mix.winRate != null ? roundPct(mix.winRate * 100) : null,
      };
    });
  }, [entries, from, anchor, includeBe, order, labels]);

  const hasAny = barData.some((r) => r.closed > 0);

  const summary = useMemo(() => {
    if (!hasAny) return null;
    const winDay = peakLabel(barData, (r) => r.wins);
    const lossDay = peakLabel(barData, (r) => r.losses);
    const beDay = peakLabel(barData, (r) => r.be);
    return { winDay, lossDay, beDay };
  }, [barData, hasAny]);

  const copy = {
    title: locale === "en" ? "By weekday (outcome mix)" : "Per hari (Min–Sab)",
    wins: locale === "en" ? "Wins" : "Menang",
    losses: locale === "en" ? "Losses" : "Rugi",
    be: "BE",
    showBe: locale === "en" ? "Include BE" : "Sertakan BE",
    all: locale === "en" ? "All" : "Semua",
  };

  if (!hasAny) {
    return (
      <p className="text-sm text-zinc-500">
        {locale === "en" ? "Need closed trades in range." : "Butuh trade close di rentang ini."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{copy.title}</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {([30, 90, 0] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRangeDays(n)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px]",
                  rangeDays === n ? "border-zinc-500 bg-zinc-800 text-zinc-200" : "border-zinc-800 text-zinc-500"
                )}
              >
                {n === 0 ? copy.all : `${n}d`}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[10px] text-zinc-400">
            <input
              type="checkbox"
              checked={includeBe}
              onChange={(e) => setIncludeBe(e.target.checked)}
              className="size-3 rounded border-zinc-600 bg-zinc-900"
            />
            {copy.showBe}
          </label>
        </div>
      </div>

      {summary ? (
        <p className="text-[11px] leading-snug text-zinc-500">
          {locale === "en" ? "Peaks · " : "Puncak · "}
          {summary.winDay ? (
            <span>
              {copy.wins}: <span className="text-zinc-300">{summary.winDay}</span>
            </span>
          ) : null}
          {summary.lossDay ? (
            <span>
              {" · "}
              {copy.losses}: <span className="text-zinc-300">{summary.lossDay}</span>
            </span>
          ) : null}
          {summary.beDay && includeBe ? (
            <span>
              {" · "}
              {copy.be}: <span className="text-zinc-300">{summary.beDay}</span>
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} />
            <YAxis domain={[0, 100]} unit="%" tick={{ fill: "#71717a", fontSize: 10 }} width={36} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string, item) => {
                const row = item.payload as Row;
                if (name === copy.wins) return [`${row.wins} · ${row.winPct}%`, name];
                if (name === copy.losses) return [`${row.losses} · ${row.lossPct}%`, name];
                if (name === copy.be) return [`${row.be} · ${row.bePct}%`, name];
                return [`${v}%`, name];
              }}
              labelFormatter={(label, payload) => {
                const row = payload?.[0]?.payload as Row | undefined;
                const wr = row?.winRatePct;
                return wr != null ? `${label} · WR ${wr}% · ${row?.closed ?? 0} close` : String(label);
              }}
            />
            <Bar dataKey="winPct" name={copy.wins} stackId="wd" fill={NOTE_CHART_COLORS.upStrong} maxBarSize={36} />
            {includeBe ? (
              <Bar dataKey="bePct" name={copy.be} stackId="wd" fill={NOTE_CHART_COLORS.infoStrong} maxBarSize={36} />
            ) : null}
            <Bar
              dataKey="lossPct"
              name={copy.losses}
              stackId="wd"
              fill={NOTE_CHART_COLORS.downStrong}
              maxBarSize={36}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
