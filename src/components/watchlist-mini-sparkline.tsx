"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type WatchlistMiniSparklineProps = {
  points: number[];
  positive: boolean;
  className?: string;
  label?: string;
};

/**
 * Compact day-move sparkline for dashboard watchlist rows.
 */
export function WatchlistMiniSparkline({
  points,
  positive,
  className,
  label = "Pergerakan hari ini (ilustratif)",
}: WatchlistMiniSparklineProps) {
  const reactId = useId().replace(/:/g, "");
  const width = 72;
  const height = 28;
  const padY = 2;

  if (points.length < 2) return null;

  const finitePoints = points.filter((value) => Number.isFinite(value));
  if (finitePoints.length < 2) return null;

  const max = Math.max(...finitePoints);
  const min = Math.min(...finitePoints);
  const range = max - min || 1;
  const stepX = width / (finitePoints.length - 1);

  const coords = finitePoints.map((value, i) => {
    const x = i * stepX;
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return { x, y: Number.isFinite(y) ? y : height / 2 };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  const stroke = positive ? "var(--profit)" : "var(--loss)";
  const gradId = `wl-spark-${reactId}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-12 shrink-0 sm:w-[4.5rem]", className)}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
