"use client";

import { useState } from "react";
import { Lock, PlayCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "aspect-video w-20 shrink-0",
  md: "aspect-video w-36 shrink-0 sm:w-44",
  lg: "aspect-video w-full",
} as const;

export function LessonPreviewThumb({
  title,
  isFree,
  hasAccess = false,
  durationMinutes,
  durationLabel,
  size = "sm",
  showPlayOverlay = false,
  durationPosition = "auto",
  className,
  posterSrc,
  watchProgress,
}: {
  title: string;
  isFree: boolean;
  hasAccess?: boolean;
  durationMinutes: number;
  durationLabel?: string;
  size?: keyof typeof sizeClasses;
  showPlayOverlay?: boolean;
  durationPosition?: "auto" | "bottom-right" | "top-left";
  className?: string;
  /** Video frame only — no course/playlist poster fallback. */
  posterSrc?: string | null;
  /** 0–1 watched progress for timeline bar at bottom of thumb */
  watchProgress?: number;
}) {
  const [src, setSrc] = useState<string | null>(posterSrc?.trim() || null);

  const isLocked = !isFree && !hasAccess;
  const isPlayable = isFree || hasAccess;
  const badgeText = durationLabel ?? `${durationMinutes}m`;
  const badgeCorner =
    durationPosition === "bottom-right" ||
    (durationPosition === "auto" && !(showPlayOverlay && isPlayable && !isLocked))
      ? "bottom-2 right-2"
      : "left-2 top-2";

  const progressRatio =
    watchProgress !== undefined
      ? Math.min(1, Math.max(0, watchProgress))
      : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-black/40",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          onError={() => setSrc(null)}
        />
      ) : null}

      {isLocked ? (
        <>
          <div className="absolute inset-0 z-[1] bg-black/35" />
          <div className="absolute inset-0 z-[2] flex items-center justify-center">
            <div className="flex size-9 items-center justify-center rounded-md border border-white/25 bg-black/60 text-white sm:size-10">
              <Lock className="size-4 sm:size-[18px]" />
            </div>
          </div>
        </>
      ) : null}

      {showPlayOverlay && isPlayable && !isLocked ? (
        <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
          <PlayCircle className="size-8 text-white drop-shadow-lg sm:size-9" />
        </div>
      ) : null}

      <span
        className={cn(
          "absolute z-[4] rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums",
          badgeCorner
        )}
      >
        {badgeText}
      </span>

      {progressRatio !== undefined && progressRatio > 0 ? (
        <div
          className="absolute inset-x-0 bottom-0 z-[5] h-0.5 bg-white/20"
          aria-hidden
        >
          <div
            className="h-full bg-[var(--hero-accent)]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </div>
      ) : null}

      <span className="sr-only">{title}</span>
    </div>
  );
}
