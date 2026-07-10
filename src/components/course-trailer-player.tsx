"use client";

import { useCallback, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, PlayCircle } from "lucide-react";

import { DEMO_VIDEO_URL } from "@/lib/video/demo";
import { cn } from "@/lib/utils";

interface CourseTrailerPlayerProps {
  title: string;
  className?: string;
  onPlaybackChange?: (active: boolean) => void;
}

export function CourseTrailerPlayer({
  title,
  className,
  onPlaybackChange,
}: CourseTrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const markStarted = useCallback(() => {
    setHasStarted(true);
    onPlaybackChange?.(true);
  }, [onPlaybackChange]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      markStarted();
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [markStarted]);

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-out",
        hasStarted && "min-w-0",
        className
      )}
      data-playing={isPlaying ? "true" : "false"}
      data-started={hasStarted ? "true" : "false"}
      data-expanded={isExpanded ? "true" : "false"}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-black shadow-[0_0_40px_var(--glow)] transition-all duration-300",
          "aspect-video w-full",
          isExpanded && "sm:aspect-[21/9]"
        )}
      >
        <video
          ref={videoRef}
          src={DEMO_VIDEO_URL}
          className={cn(
            "size-full object-contain transition-opacity duration-300",
            hasStarted ? "opacity-100" : "opacity-0"
          )}
          playsInline
          preload="metadata"
          onPlay={() => {
            markStarted();
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={() => void togglePlay()}
          aria-label={`Trailer ${title}`}
        />

        {!hasStarted && (
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-accent-soft via-surface-2 to-background transition-colors hover:from-accent-soft/90"
            aria-label="Putar trailer"
          >
            <PlayCircle className="size-14 text-foreground/60" />
            <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white/80">
              Trailer 0:45
            </span>
          </button>
        )}

        {hasStarted && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3">
            <button
              type="button"
              onClick={() => void togglePlay()}
              className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
              aria-label={isPlaying ? "Jeda" : "Putar"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
              aria-label={isExpanded ? "Perkecil trailer" : "Perbesar trailer"}
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
