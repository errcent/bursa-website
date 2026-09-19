"use client";

import {
  Area,
  AreaChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import { seriesYDomain } from "@/lib/note/stats";
import type { AllocationSlice, AllocationTimePoint, HistoryPoint } from "@/lib/note/track/types";

const PIE_PALETTE = [
  NOTE_CHART_COLORS.upStrong,
  NOTE_CHART_COLORS.infoStrong,
  NOTE_CHART_COLORS.warnStrong,
  NOTE_CHART_COLORS.downSoft,
  NOTE_CHART_COLORS.upSoft,
  "#a78bfa",
  "#94a3b8",
];

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 8,
  fontSize: 12,
};

export function TrackAllocationPie({ slices }: { slices: AllocationSlice[] }) {
  if (!slices.length) {
    return <p className="text-sm text-zinc-400">-</p>;
  }
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="symbol" innerRadius={52} outerRadius={78} paddingAngle={2}>
            {slices.map((_, i) => (
              <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _n, p) => [`${v.toFixed(0)}`, (p.payload as AllocationSlice).symbol]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrackAllocationOverTime({ series, symbols }: { series: AllocationTimePoint[]; symbols: string[] }) {
  if (!series.length || !symbols.length) {
    return <p className="text-sm text-zinc-400">-</p>;
  }
  const data = series.map((p) => {
    const row: Record<string, string | number> = { date: p.date.slice(5) };
    for (const s of symbols) row[s] = Math.round((p.weights[s] ?? 0) * 10) / 10;
    return row;
  });

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} stackOffset="expand">
          <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          {symbols.map((sym, i) => (
            <Area
              key={sym}
              type="monotone"
              dataKey={sym}
              stackId="w"
              stroke={PIE_PALETTE[i % PIE_PALETTE.length]}
              fill={PIE_PALETTE[i % PIE_PALETTE.length]}
              fillOpacity={0.75}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrackHistoryLine({
  points,
  formatValue,
  pnlMode = false,
}: {
  points: HistoryPoint[];
  formatValue?: (n: number) => string;
  /** When true, Y-axis fits data band (not anchored at 0). */
  pnlMode?: boolean;
}) {
  if (!points.length) return <p className="text-sm text-zinc-400">-</p>;
  const yDomain = pnlMode ? seriesYDomain(points.map((p) => p.value)) : undefined;
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} tick={{ fill: "#71717a", fontSize: 10 }} />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#71717a", fontSize: 10 }}
            width={56}
            tickFormatter={formatValue ? (v) => formatValue(Number(v)) : undefined}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={formatValue ? (v: number) => [formatValue(v), pnlMode ? "P/L" : "Value"] : undefined}
          />
          <Line type="monotone" dataKey="value" stroke={NOTE_CHART_COLORS.up} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
