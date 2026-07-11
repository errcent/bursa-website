import { ArrowLeftRight, Bitcoin, LineChart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Instrument, Level } from "@/lib/types";

const instrumentIcon: Record<Instrument, typeof LineChart> = {
  Saham: LineChart,
  Crypto: Bitcoin,
  Forex: ArrowLeftRight,
};

export function InstrumentBadge({
  instrument,
  className,
}: {
  instrument: Instrument;
  className?: string;
}) {
  const Icon = instrumentIcon[instrument];
  return (
    <Badge variant="accent" className={cn("gap-1", className)}>
      <Icon className="size-3" />
      {instrument}
    </Badge>
  );
}

const levelStyle: Record<Level, string> = {
  Pemula: "border-emerald/30 bg-emerald/10 text-emerald",
  Menengah: "border-border bg-secondary text-foreground/90",
  Mahir: "border-amber/30 bg-amber/10 text-amber",
};

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <Badge variant="outline" className={cn(levelStyle[level], className)}>
      {level}
    </Badge>
  );
}
