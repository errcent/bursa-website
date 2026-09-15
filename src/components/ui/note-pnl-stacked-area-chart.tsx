"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PnlStackPoint } from "@/lib/note/stats";
import { cn } from "@/lib/utils";

const PALETTE = {
  wins: { stroke: "var(--chart-up)", fill: "var(--chart-stack-wins, var(--chart-up))" },
  losses: { stroke: "var(--chart-down)", fill: "var(--chart-stack-losses, var(--chart-down))" },
  net: { stroke: "var(--chart-up-soft)", fill: "var(--chart-stack-net, var(--chart-up-soft))" },
} as const;

type NotePnlStackedAreaChartProps = {
  data: PnlStackPoint[];
  locale?: "id" | "en";
  className?: string;
  formatValue?: (n: number) => string;
};

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
};

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  labels,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatValue: (n: number) => string;
  labels: { wins: string; losses: string; net: string };
}) {
  if (!active || !payload?.length) return null;

  let wins = 0;
  let losses = 0;
  for (const item of payload) {
    if (item.name === labels.losses) losses = item.value ?? 0;
    if (item.name === labels.wins) wins = item.value ?? 0;
  }
  const net = wins - losses;

  const rows = [
    { name: labels.wins, value: wins, color: "var(--chart-up)" },
    { name: labels.losses, value: losses, color: "var(--chart-down)" },
    { name: labels.net, value: net, color: "var(--chart-up-soft)" },
  ];

  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 font-medium text-zinc-100">{label}</p>
      <ul className="space-y-1">
        {rows.map((item) => (
          <li key={item.name} className="flex items-center gap-2 tabular-nums text-zinc-300">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-zinc-400">{item.name}</span>
            <span className="ml-auto text-zinc-100">{formatValue(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NotePnlStackedAreaChart({
  data,
  locale = "id",
  className,
  formatValue = (n) => String(n),
}: NotePnlStackedAreaChartProps) {
  const labels = useMemo(
    () =>
      locale === "en"
        ? { wins: "Wins", losses: "Losses", net: "Net" }
        : { wins: "Menang", losses: "Rugi", net: "Net" },
    [locale]
  );

  const chartData = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        netStack: Math.max(0, row.net),
      })),
    [data]
  );

  const hasActivity = chartData.some((d) => d.wins > 0 || d.losses > 0);

  if (!hasActivity) {
    return (
      <p className={cn("text-xs text-zinc-500", className)}>
        {locale === "en" ? "No closed trades this year yet." : "Belum ada trade close tahun ini."}
      </p>
    );
  }

  return (
    <div className={cn("h-[220px] w-full min-w-0", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="notePnlWins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-stack-wins)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="var(--chart-stack-wins)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="notePnlLosses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-stack-losses)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--chart-stack-losses)" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="notePnlNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-stack-net)" stopOpacity={0.65} />
              <stop offset="100%" stopColor="var(--chart-stack-net)" stopOpacity={0.08} />
            </linearGradient>
          </defs>
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
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tick={{ fill: "#71717a", fontSize: 11 }}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.35)", strokeWidth: 1 }}
            content={<ChartTooltip formatValue={formatValue} labels={labels} />}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingBottom: 8 }}
            formatter={(value) => (
              <span className="text-zinc-400">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="losses"
            name={labels.losses}
            stackId="pnl"
            stroke={PALETTE.losses.stroke}
            fill="url(#notePnlLosses)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="wins"
            name={labels.wins}
            stackId="pnl"
            stroke={PALETTE.wins.stroke}
            fill="url(#notePnlWins)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="netStack"
            name={labels.net}
            stackId="pnl"
            stroke={PALETTE.net.stroke}
            fill="url(#notePnlNet)"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
