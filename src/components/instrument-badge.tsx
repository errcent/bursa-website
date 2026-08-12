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

const LEVEL_BARS: Record<Level, number> = {
  Pemula: 1,
  Menengah: 2,
  Mahir: 3,
};

export const LEVEL_TOOLTIP: Record<Level, string> = {
  Pemula: "Kelas ini cocok untuk pemula",
  Menengah: "Kelas ini cocok untuk menengah",
  Mahir: "Kelas ini cocok untuk profesional",
};

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const count = LEVEL_BARS[level];
  const label = LEVEL_TOOLTIP[level];

  return (
    <span
      data-level-hotspot
      className={cn("inline-flex items-center gap-[3px]", className)}
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="size-[7px] rounded-[1px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        />
      ))}
    </span>
  );
}
