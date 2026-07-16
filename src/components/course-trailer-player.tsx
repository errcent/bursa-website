"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, PlayCircle } from "lucide-react";

import {
  MentorVideoBar,
  type MentorVideoBarMentor,
} from "@/components/video/mentor-video-bar";
import { DEMO_VIDEO_URL } from "@/lib/video/demo";
import {
  getFullscreenElement,
  isVideoFullscreen,
  requestVideoFullscreen,
  subscribeFullscreenChange,
  subscribeVideoFullscreenChange,
} from "@/lib/video/fullscreen";
import { cn } from "@/lib/utils";

const TRAILER_DURATION_SECONDS = 45;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getEffectiveDuration(video: HTMLVideoElement | null, fallback: number): number {
  if (video && Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }
  return fallback;
}

interface CourseTrailerPlayerProps {
  title: string;
  mentor?: MentorVideoBarMentor | null;
  posterUrl?: string;
  className?: string;
  variant?: "default" | "cinema";
  autoStart?: boolean;
  onPlaybackChange?: (active: boolean) => void;
}

export function CourseTrailerPlayer({
  title,
  mentor,
  posterUrl,
  className,
  variant = "default",
  autoStart = false,
  onPlaybackChange,
}: CourseTrailerPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(TRAILER_DURATION_SECONDS);
  const [showControls, setShowControls] = useState(true);

  const markStarted = useCallback(() => {
    setHasStarted(true);
    onPlaybackChange?.(true);
  }, [onPlaybackChange]);

  const revealControls = useCallback(() => {
    setShowControls(true);
  }, []);

  const syncDuration = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(getFullscreenElement()) || isVideoFullscreen(videoRef.current));
    };

    const cleanups = [
      subscribeFullscreenChange(syncFullscreenState),
      subscribeVideoFullscreenChange(videoRef.current, syncFullscreenState),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [hasStarted]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      await requestVideoFullscreen(container, videoRef.current);
    } catch {
      // Fullscreen may be blocked by browser policy or unsupported APIs.
    }
  }, []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer);
      if (isPlaying) {
        hideTimer = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", resetTimer);
    container?.addEventListener("touchstart", resetTimer, { passive: true });
    resetTimer();

    return () => {
      clearTimeout(hideTimer);
      container?.removeEventListener("mousemove", resetTimer);
      container?.removeEventListener("touchstart", resetTimer);
    };
  }, [isPlaying]);

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

  const handleVideoAreaTap = useCallback(() => {
    if (isPlaying) {
      revealControls();
      return;
    }
    void togglePlay();
  }, [isPlaying, revealControls, togglePlay]);

  const seekTo = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      const video = videoRef.current;
      const max = getEffectiveDuration(video, duration);
      if (!bar || !video || max <= 0) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      video.currentTime = ratio * max;
      setCurrentTime(video.currentTime);
    },
    [duration]
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      const max = getEffectiveDuration(video, duration);
      if (!video || max <= 0) return;
      const next = Math.max(0, Math.min(max, video.currentTime + deltaSeconds));
      video.currentTime = next;
      setCurrentTime(next);
      revealControls();
    },
    [duration, revealControls]
  );

  const handleProgressPointer = useCallback(
    (clientX: number) => {
      markStarted();
      seekTo(clientX);
      revealControls();
    },
    [markStarted, revealControls, seekTo]
  );

  const isCinema = variant === "cinema";

  useEffect(() => {
    if (!autoStart) return;
    const video = videoRef.current;
    if (!video) return;
    markStarted();
    void video.play().then(() => setIsPlaying(true)).catch(() => undefined);
  }, [autoStart, markStarted]);

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-out",
        hasStarted && "min-w-0",
        className
      )}
      data-playing={isPlaying ? "true" : "false"}
      data-started={hasStarted ? "true" : "false"}
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      <div
        ref={containerRef}
        className={cn(
          "video-player-shell group/trailer relative overflow-hidden bg-black transition-all duration-300",
          isCinema
            ? "size-full rounded-none border-0 shadow-none"
            : "aspect-video w-full rounded-2xl border border-border shadow-[0_0_40px_var(--glow)]"
        )}
      >
        <video
          ref={videoRef}
          src={DEMO_VIDEO_URL}
          poster={posterUrl}
          className={cn(
            "size-full object-contain transition-opacity duration-300",
            hasStarted || isCinema ? "opacity-100" : "opacity-0"
          )}
          playsInline
          preload="metadata"
          onPlay={() => {
            markStarted();
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video) setCurrentTime(video.currentTime);
          }}
          onLoadedMetadata={syncDuration}
          onDurationChange={syncDuration}
          aria-label={`Trailer ${title}`}
        />

        {!hasStarted && !autoStart && (
          <button
            type="button"
            onClick={() => void togglePlay()}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-3 transition-colors",
              posterUrl
                ? "bg-black/25 hover:bg-black/35"
                : "bg-gradient-to-br from-accent-soft via-surface-2 to-background hover:from-accent-soft/90"
            )}
            aria-label="Putar trailer"
          >
            {posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full object-cover"
              />
            )}
            <PlayCircle className="relative z-10 size-14 text-foreground/80 drop-shadow-md" />
            <span className="absolute bottom-3 left-3 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white/80">
              Trailer 0:45
            </span>
          </button>
        )}

        {hasStarted && isPlaying && (
          <button
            type="button"
            data-play-overlay
            onClick={handleVideoAreaTap}
            className="absolute inset-x-0 top-0 bottom-24 z-10 cursor-default bg-transparent"
            aria-label="Tampilkan kontrol trailer"
          />
        )}

        {hasStarted && isCinema && (
          <div
            data-video-controls
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex items-center gap-4 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-md transition-opacity duration-300 sm:px-6",
              showControls || !isPlaying ? "opacity-100" : "opacity-95"
            )}
          >
            {posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterUrl}
                alt=""
                aria-hidden
                className="hidden size-12 rounded object-cover sm:block"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{title}</p>
              {mentor && (
                <p className="truncate text-xs text-white/60">{mentor.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void togglePlay()}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black"
              aria-label={isPlaying ? "Jeda" : "Putar"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => {
                videoRef.current?.pause();
                setIsPlaying(false);
                setHasStarted(false);
                onPlaybackChange?.(false);
              }}
              className="hidden text-xs text-white/60 underline-offset-2 hover:text-white hover:underline sm:inline"
            >
              Tutup
            </button>
            <span className="hidden min-w-[5rem] font-mono text-xs text-white/80 tabular-nums sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        )}

        {hasStarted && !isCinema && (
          <div
            data-video-controls
            className={cn(
              "absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300",
              showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}
            onPointerDown={revealControls}
          >
            <div
              ref={progressRef}
              className="group/progress relative mb-3 flex min-h-11 cursor-pointer touch-none items-center sm:min-h-0 sm:h-1.5"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressPointer(e.clientX);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                isScrubbingRef.current = true;
                progressRef.current?.setPointerCapture(e.pointerId);
                handleProgressPointer(e.clientX);
              }}
              onPointerMove={(e) => {
                if (!isScrubbingRef.current) return;
                handleProgressPointer(e.clientX);
              }}
              onPointerUp={(e) => {
                isScrubbingRef.current = false;
                progressRef.current?.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={() => {
                isScrubbingRef.current = false;
              }}
              role="slider"
              aria-label="Progres trailer"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            >
              <div className="relative h-3 w-full rounded-full bg-white/20 sm:h-1.5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/90 transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  seekBy(-10);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 px-2 text-[11px] font-medium text-white backdrop-blur hover:bg-white/25 sm:hidden"
                aria-label="Mundur 10 detik"
              >
                -10s
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void togglePlay();
                }}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
                aria-label={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  seekBy(10);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 px-2 text-[11px] font-medium text-white backdrop-blur hover:bg-white/25 sm:hidden"
                aria-label="Maju 10 detik"
              >
                +10s
              </button>

              <span className="min-w-[5rem] font-mono text-xs text-white/90 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void toggleFullscreen();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
                aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              >
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {mentor && !isCinema ? <MentorVideoBar mentor={mentor} className="mt-3" /> : null}
    </div>
  );
}
