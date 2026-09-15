"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import { rollingWinRateSeries, seriesYDomain } from "@/lib/note/stats";
import type { JournalEntry } from "@/lib/note/types";
import { cn } from "@/lib/utils";

type Props = {
  entries: JournalEntry[];
  locale: "id" | "en";
};

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  fontSize: 12,
};

export function NoteAnalyticsWinrateTrend({ entries, locale }: Props) {
  const [windowSize, setWindowSize] = useState<10 | 20 | 30>(20);
  const [includeBe, setIncludeBe] = useState(true);

  const points = useMemo(
    () =>
      rollingWinRateSeries(entries, {
        windowSize,
        includeBe,
        maxPoints: 100,
      }),
    [entries, windowSize, includeBe]
  );

  const yDomain = useMemo(() => {
    const vals = points.map((p) => p.winRatePct).filter((v): v is number => v != null);
    if (!vals.length) return [0, 100] as [number, number];
    const d = seriesYDomain(vals, 0.06);
    return [Math.max(0, d[0]), Math.min(100, d[1])] as [number, number];
  }, [points]);

  const title = locale === "en" ? "Rolling win rate" : "Win rate rolling";
  const hint =
    locale === "en"
      ? `Last ${windowSize} closes at each point - WR moves as you trade.`
      : `${windowSize} close terakhir per titik - WR bergerak seiring trade.`;

  if (points.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        {locale === "en"
          ? `Need at least ${windowSize} closed trades for rolling win rate.`
          : `Butuh minimal ${windowSize} trade close untuk win rate rolling.`}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{title}</p>
          <p className="text-[10px] text-zinc-600">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {([10, 20, 30] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWindowSize(n)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px]",
                  windowSize === n ? "border-zinc-500 bg-zinc-800 text-zinc-200" : "border-zinc-800 text-zinc-500"
                )}
              >
                {n}
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
            {locale === "en" ? "Include BE" : "Sertakan BE"}
          </label>
        </div>
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 9 }}
              interval="preserveStartEnd"
              minTickGap={10}
            />
            <YAxis domain={yDomain} unit="%" tick={{ fill: "#71717a", fontSize: 10 }} width={36} />
            <ReferenceLine y={50} stroke="rgba(161,161,170,0.25)" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ""}
              formatter={(v: number) => [`${v}%`, "Win rate"]}
            />
            <Line
              type="monotone"
              dataKey="winRatePct"
              stroke={NOTE_CHART_COLORS.infoStrong}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
