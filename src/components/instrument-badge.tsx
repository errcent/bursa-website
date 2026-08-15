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

const LEVEL_SHAPE: Record<Level, "circle" | "square" | "triangle"> = {
  Pemula: "circle",
  Menengah: "square",
  Mahir: "triangle",
};

export const LEVEL_TOOLTIP: Record<Level, string> = {
  Pemula: "Kelas ini cocok untuk pemula",
  Menengah: "Kelas ini cocok untuk menengah",
  Mahir: "Kelas ini cocok untuk profesional",
};

const LEVEL_SHAPE_FILL = "rgba(0, 0, 0, 0.5)";

function LevelShape({ shape }: { shape: "circle" | "square" | "triangle" }) {
  if (shape === "circle") {
    return (
      <span
        aria-hidden
        className="block size-3 rounded-full"
        style={{ backgroundColor: LEVEL_SHAPE_FILL }}
      />
    );
  }
  if (shape === "square") {
    return (
      <span
        aria-hidden
        className="block size-3"
        style={{ backgroundColor: LEVEL_SHAPE_FILL }}
      />
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className="block size-3"
      fill={LEVEL_SHAPE_FILL}
    >
      <polygon points="6,1 11.2,11 0.8,11" />
    </svg>
  );
}

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  const shape = LEVEL_SHAPE[level];
  const label = LEVEL_TOOLTIP[level];

  return (
    <span
      data-level-hotspot
      className={cn("inline-flex items-center", className)}
      aria-label={label}
    >
      <LevelShape shape={shape} />
    </span>
  );
}
