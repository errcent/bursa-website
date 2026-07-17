"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, PlayCircle } from "lucide-react";

import {
  MentorVideoBar,
  type MentorVideoBarMentor,
} from "@/components/video/mentor-video-bar";
import {
  DEFAULT_QUALITY_OPTIONS,
  VideoControlBar,
  type VideoQualityValue,
} from "@/components/video/video-control-bar";
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(TRAILER_DURATION_SECONDS);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<VideoQualityValue>("Auto");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [hasSubtitleTracks, setHasSubtitleTracks] = useState(false);

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
        hideTimer = setTimeout(() => setShowControls(false), 2500);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncSubtitleTracks = () => {
      setHasSubtitleTracks(video.textTracks.length > 0);
    };

    syncSubtitleTracks();
    video.textTracks.addEventListener("addtrack", syncSubtitleTracks);
    video.textTracks.addEventListener("removetrack", syncSubtitleTracks);

    return () => {
      video.textTracks.removeEventListener("addtrack", syncSubtitleTracks);
      video.textTracks.removeEventListener("removetrack", syncSubtitleTracks);
    };
  }, [hasStarted]);

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
    if (isPlaying && showControls) {
      setShowControls(false);
      return;
    }
    revealControls();
  }, [isPlaying, revealControls, showControls]);

  const seekTo = useCallback(
    (clientX: number) => {
      const bar = containerRef.current?.querySelector<HTMLElement>("[data-video-controls] [role='slider']");
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

  const handleSeek = useCallback(
    (clientX: number) => {
      markStarted();
      seekTo(clientX);
      revealControls();
    },
    [markStarted, revealControls, seekTo]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, value));
    video.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  }, []);

  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hasSubtitleTracks) return;

    const next = !subtitlesEnabled;
    for (let i = 0; i < video.textTracks.length; i += 1) {
      video.textTracks[i].mode = next ? "showing" : "hidden";
    }
    setSubtitlesEnabled(next);
  }, [hasSubtitleTracks, subtitlesEnabled]);

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

        {hasStarted && (
          <button
            type="button"
            onClick={handleVideoAreaTap}
            className="absolute inset-0 z-10 cursor-default bg-transparent"
            aria-label="Tampilkan atau sembunyikan kontrol trailer"
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
          <VideoControlBar
            isPlaying={isPlaying}
            showControls={showControls}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            playbackSpeed={playbackSpeed}
            quality={quality}
            qualityOptions={DEFAULT_QUALITY_OPTIONS.map((option) => ({
              ...option,
              disabled: option.value !== "Auto",
            }))}
            isFullscreen={isFullscreen}
            subtitlesEnabled={subtitlesEnabled}
            hasSubtitleTracks={hasSubtitleTracks}
            onRevealControls={revealControls}
            onTogglePlay={() => void togglePlay()}
            onSeek={handleSeek}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onChangeSpeed={changeSpeed}
            onChangeQuality={setQuality}
            onToggleSubtitles={toggleSubtitles}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
      </div>

      {mentor && !isCinema ? <MentorVideoBar mentor={mentor} className="mt-3" /> : null}
    </div>
  );
}
