"use client";

import { useMemo } from "react";
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

import { noteCopy } from "@/lib/note/copy";
import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import { seriesYDomain, type PnlStackGranularity, type SeriesPoint } from "@/lib/note/stats";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  fontSize: 12,
};

type Props = {
  points: SeriesPoint[];
  locale: "id" | "en";
  formatValue: (n: number) => string;
  granularity?: PnlStackGranularity;
  className?: string;
  loading?: boolean;
};

export function NoteOverviewPortfolioChart({
  points,
  locale,
  formatValue,
  granularity = "day",
  className,
  loading,
}: Props) {
  const title = locale === "en" ? "Cumulative results (journal)" : "Kumulatif hasil (jurnal)";
  const empty =
    locale === "en"
      ? "Log closed trades to see your equity curve."
      : "Log trade close untuk lihat kurva hasil.";
  const loadingLabel = noteCopy(locale).loading;

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: p.tickLabel ?? (p.date.length >= 10 ? p.date.slice(5) : p.date),
      })),
    [points]
  );

  const yDomain = useMemo(
    () => seriesYDomain(points.map((p) => p.value)),
    [points]
  );

  if (loading) {
    return <p className={cn("text-xs text-zinc-500", className)}>{loadingLabel}</p>;
  }

  if (!points.length) {
    return (
      <div
        className={cn(
          "flex h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/90 bg-zinc-950/40 px-4 text-center",
          className
        )}
      >
        <p className="text-xs text-zinc-500">{empty}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="text-[10px] text-zinc-600">
        {locale === "en"
          ? "Trading P/L over time - not account balance or holdings value."
          : "PnL trading over time - bukan saldo akun atau nilai holdings."}
      </p>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="color-mix(in srgb, var(--foreground) 10%, transparent)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={12}
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <YAxis
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fill: "#71717a", fontSize: 10 }}
              width={48}
              tickFormatter={(v) => formatValue(Number(v))}
            />
            <ReferenceLine y={0} stroke="rgba(161,161,170,0.35)" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { date?: string } | undefined;
                return row?.date ?? "";
              }}
              formatter={(v: number) => [formatValue(v), locale === "en" ? "Cumulative P/L" : "PnL kumulatif"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={NOTE_CHART_COLORS.upSoft}
              strokeWidth={2}
              dot={granularity === "trade" ? { r: 2, fill: NOTE_CHART_COLORS.upSoft } : false}
              activeDot={{ r: 3, fill: NOTE_CHART_COLORS.upSoft }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
