"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import type { PnlStackPoint } from "@/lib/note/stats";
import { cn } from "@/lib/utils";

type NotePnlTradeScatterChartProps = {
  data: PnlStackPoint[];
  locale?: "id" | "en";
  className?: string;
  formatValue?: (n: number) => string;
};

type TradeDot = {
  label: string;
  y: number;
  net: number;
  wins: number;
  losses: number;
};

function TradeDotShape(props: {
  cx?: number;
  cy?: number;
  payload?: TradeDot;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const up = payload.net >= 0;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={up ? "var(--chart-up-strong, var(--chart-up))" : "var(--chart-down-strong, var(--chart-down))"}
      fillOpacity={0.92}
      stroke={up ? "var(--chart-up)" : "var(--chart-down)"}
      strokeWidth={1}
    />
  );
}

function TradeTooltip({
  active,
  payload,
  formatValue,
  locale,
}: TooltipProps<number, string> & {
  formatValue: (n: number) => string;
  locale: "id" | "en";
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TradeDot | undefined;
  if (!row) return null;
  const labels =
    locale === "en"
      ? { wins: "Win", losses: "Loss", net: "Net" }
      : { wins: "Menang", losses: "Rugi", net: "Net" };

  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 font-medium text-zinc-100">{row.label}</p>
      <ul className="space-y-1 tabular-nums text-zinc-300">
        {row.wins > 0 ? (
          <li>
            <span className="text-zinc-500">{labels.wins}: </span>
            {formatValue(row.wins)}
          </li>
        ) : null}
        {row.losses > 0 ? (
          <li>
            <span className="text-zinc-500">{labels.losses}: </span>
            {formatValue(-row.losses)}
          </li>
        ) : null}
        <li>
          <span className="text-zinc-500">{labels.net}: </span>
          <span className={row.net >= 0 ? "note-pnl-up" : "note-pnl-down"}>{formatValue(row.net)}</span>
        </li>
      </ul>
    </div>
  );
}

export function NotePnlTradeScatterChart({
  data,
  locale = "id",
  className,
  formatValue = (n) => String(n),
}: NotePnlTradeScatterChartProps) {
  const points: TradeDot[] = useMemo(
    () =>
      data.map((row) => ({
        label: row.label,
        y: row.net,
        net: row.net,
        wins: row.wins,
        losses: row.losses,
      })),
    [data]
  );

  const hasActivity = points.some((p) => p.wins > 0 || p.losses > 0);

  if (!hasActivity) {
    return (
      <p className={cn("text-xs text-zinc-500", className)}>
        {locale === "en" ? "No closed trades in this range." : "Belum ada trade close di rentang ini."}
      </p>
    );
  }

  const yMax = Math.max(...points.map((p) => Math.abs(p.net)), 1);
  const colorHint =
    locale === "en" ? "Green = win · Red = loss" : "Hijau = menang · Merah = rugi";

  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-right text-[10px] text-zinc-500">{colorHint}</p>
      <div className="h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
            <CartesianGrid
              vertical={false}
              stroke="color-mix(in srgb, var(--foreground) 10%, transparent)"
              strokeDasharray="3 3"
            />
            <XAxis
              type="category"
              dataKey="label"
              name="Trade"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={12}
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              width={44}
              domain={[-yMax * 1.12, yMax * 1.12]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(v) => formatValue(v)}
            />
            <ReferenceLine y={0} stroke="color-mix(in srgb, var(--foreground) 22%, transparent)" />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 }}
              content={<TradeTooltip formatValue={formatValue} locale={locale} />}
            />
            <Scatter data={points} fill="var(--chart-up)" shape={<TradeDotShape />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
