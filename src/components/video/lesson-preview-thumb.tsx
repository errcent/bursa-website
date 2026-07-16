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
  size = "sm",
  showPlayOverlay = false,
  className,
}: {
  title: string;
  /** Free-preview lesson (first of module 1 or preview flag). */
  isFree: boolean;
  /** Enrolled / subscribed — clear thumbnail even for paid lessons. */
  hasAccess?: boolean;
  durationMinutes: number;
  size?: keyof typeof sizeClasses;
  /** Centered play affordance for curriculum-style cards (playable lessons only). */
  showPlayOverlay?: boolean;
  className?: string;
}) {
  const isLocked = !isFree && !hasAccess;
  const isPlayable = isFree || hasAccess;

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
        className={cn(
          "pointer-events-none size-full object-cover",
          isLocked && "scale-105 blur-md"
        )}
      />

      {isLocked ? (
        <>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <PlayCircle className="size-9 text-white opacity-80 drop-shadow-lg transition-opacity group-hover:opacity-100 sm:size-10" />
        </div>
      ) : null}

      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums">
        {durationMinutes}m
      </span>

      <span className="sr-only">{title}</span>
    </div>
  );
}
