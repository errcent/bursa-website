"use client";

import { Lock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEMO_VIDEO_URL } from "@/lib/video/demo";

const sizeClasses = {
  sm: "aspect-video w-20 shrink-0",
  md: "aspect-video w-36 shrink-0 sm:w-44",
} as const;

export function LessonPreviewThumb({
  title,
  isFree,
  hasAccess = false,
  durationMinutes,
  size = "sm",
  className,
}: {
  title: string;
  /** Free-preview lesson (first of module 1 or preview flag). */
  isFree: boolean;
  /** Enrolled / subscribed — clear thumbnail even for paid lessons. */
  hasAccess?: boolean;
  durationMinutes: number;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const isLocked = !isFree && !hasAccess;

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
          <div className="absolute inset-0 bg-background/25 backdrop-blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white">
              <Lock className="size-3.5" />
            </div>
          </div>
        </>
      ) : isFree ? (
        <div className="absolute left-1 top-1">
          <span className="inline-flex items-center gap-0.5 rounded bg-emerald/90 px-1 py-0.5 text-[9px] font-medium text-white">
            <Sparkles className="size-2.5" />
            Gratis
          </span>
        </div>
      ) : null}

      <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 py-0.5 font-mono text-[10px] text-white tabular-nums">
        {durationMinutes}m
      </span>

      <span className="sr-only">{title}</span>
    </div>
  );
}
