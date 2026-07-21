"use client";

import { Lock, PlayCircle, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEMO_VIDEO_URL } from "@/lib/video/demo";

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
}: {
  title: string;
  /** Free-preview lesson (first of module 1 or preview flag). */
  isFree: boolean;
  /** Enrolled / subscribed — clear thumbnail even for paid lessons. */
  hasAccess?: boolean;
  durationMinutes: number;
  /** Override badge text (e.g. `16:00` for MasterClass-style curriculum rows). */
  durationLabel?: string;
  size?: keyof typeof sizeClasses;
  /** Centered play affordance for curriculum-style cards (playable lessons only). */
  showPlayOverlay?: boolean;
  /** Where to pin the duration badge; `auto` keeps legacy top-left when play overlay is on. */
  durationPosition?: "auto" | "bottom-right" | "top-left";
  className?: string;
}) {
  const isLocked = !isFree && !hasAccess;
  const isPlayable = isFree || hasAccess;
  const badgeText = durationLabel ?? `${durationMinutes}m`;
  const badgeCorner =
    durationPosition === "bottom-right" ||
    (durationPosition === "auto" && !(showPlayOverlay && isPlayable && !isLocked))
      ? "bottom-2 right-2"
      : "left-2 top-2";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-black",
        sizeClasses[size],
        className
      )}
      aria-hidden
    >
      <video
        src={`${DEMO_VIDEO_URL}#t=0.5`}
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 size-full object-cover object-center"
      />

      {isLocked ? (
        <>
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white sm:size-10">
              <Lock className="size-4 sm:size-[18px]" />
            </div>
          </div>
        </>
      ) : isFree ? (
        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center gap-0.5 rounded bg-emerald/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
            <Sparkles className="size-2.5" />
            Gratis
          </span>
        </div>
      ) : null}

      {showPlayOverlay && isPlayable && !isLocked ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <PlayCircle className="size-8 text-white drop-shadow-lg sm:size-9" />
        </div>
      ) : null}

      <span
        className={cn(
          "absolute z-20 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums",
          badgeCorner
        )}
      >
        {badgeText}
      </span>

      <span className="sr-only">{title}</span>
    </div>
  );
}
