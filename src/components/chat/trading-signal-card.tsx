import { ArrowLeftRight, Bitcoin, LineChart, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Instrument } from "@/lib/types";
import type { SignalDirection, SignalStatus, TradingSignal } from "@/lib/chat/types";

const instrumentIcon: Record<Instrument, typeof LineChart> = {
  Saham: LineChart,
  Crypto: Bitcoin,
  Forex: ArrowLeftRight,
};

function formatPrice(value: number, instrument: Instrument): string {
  if (instrument === "Forex") {
    return value.toFixed(3);
  }
  if (instrument === "Crypto" && value > 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return value.toLocaleString("id-ID");
}

function calcRiskReward(signal: TradingSignal): number {
  const { entry, target, stopLoss, direction } = signal;
  const reward = Math.abs(target - entry);
  const risk = Math.abs(entry - stopLoss);
  if (risk === 0) return 0;
  return direction === "LONG" ? reward / risk : reward / risk;
}

interface TradingSignalCardProps {
  signal: TradingSignal;
  compact?: boolean;
  className?: string;
}

export function TradingSignalCard({ signal, compact, className }: TradingSignalCardProps) {
  const Icon = instrumentIcon[signal.instrument];
  const isLong = signal.direction === "LONG";
  const rr = calcRiskReward(signal);

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 py-0 shadow-none",
        isLong ? "border-l-profit" : "border-l-loss",
        compact ? "text-xs" : "text-sm",
        className
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-semibold tracking-tight">
            ${signal.ticker}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 font-mono",
              isLong
                ? "border-profit/30 bg-profit/10 text-profit"
                : "border-loss/30 bg-loss/10 text-loss"
            )}
          >
            {isLong ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {signal.direction}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" className="gap-1">
            <Icon className="size-3" />
            {signal.instrument}
          </Badge>
          <Badge
            variant={signal.status === "ACTIVE" ? "accent" : "secondary"}
            className={cn(
              signal.status === "ACTIVE" && "border-emerald/30 bg-emerald/10 text-emerald"
            )}
          >
            {signal.status === "ACTIVE" ? "AKTIF" : "TUTUP"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-3 pb-4">
        <div className="rounded-lg bg-muted/50 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entry</p>
          <p className="font-mono font-semibold tabular-nums">
            {formatPrice(signal.entry, signal.instrument)}
          </p>
        </div>
        <div className="rounded-lg bg-profit/5 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-profit">Target</p>
          <p className="font-mono font-semibold tabular-nums text-profit">
            {formatPrice(signal.target, signal.instrument)}
          </p>
        </div>
        <div className="rounded-lg bg-loss/5 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-loss">Stop Loss</p>
          <p className="font-mono font-semibold tabular-nums text-loss">
            {formatPrice(signal.stopLoss, signal.instrument)}
          </p>
        </div>
      </CardContent>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          Risk/Reward:{" "}
          <span className="font-mono font-medium text-foreground">1:{rr.toFixed(1)}</span>
        </span>
        {signal.note && <span className="max-w-[50%] truncate italic">{signal.note}</span>}
      </div>
    </Card>
  );
}
