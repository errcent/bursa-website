"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

import { ProtectionWarning } from "@/components/video/protection-warning";
import { VideoWatermark } from "@/components/video/video-watermark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getFullscreenElement,
  isVideoFullscreen,
  requestVideoFullscreen,
  subscribeFullscreenChange,
  subscribeVideoFullscreenChange,
} from "@/lib/video/fullscreen";
import {
  applyVideoProtection,
  generatePlaybackToken,
  type ProtectionViolationType,
  watermarkConfig,
} from "@/lib/video/protection";
import { DEMO_VIDEO_URL, resolvePlayableVideoUrl } from "@/lib/video/demo";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const QUALITY_OPTIONS = ["Auto", "1080p", "720p", "480p"] as const;

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

export interface ProtectedVideoPlayerProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  durationMinutes: number;
  /** Guest free-preview mode (no watermark). False for enrolled full access. */
  isPreview: boolean;
  /** Enrolled / subscribed — unlocks paid lessons via playback token. */
  hasAccess?: boolean;
  userId?: string;
  userEmail?: string;
  videoSrc?: string;
  className?: string;
  /** External seek request (e.g. jump from catatan / Q&A timestamp). */
  seekRequestSeconds?: number | null;
  onTimeUpdate?: (seconds: number) => void;
  onProtectionViolation?: (type: ProtectionViolationType, lessonId: string) => void;
}

export function ProtectedVideoPlayer({
  courseId,
  lessonId,
  lessonTitle,
  durationMinutes,
  isPreview,
  hasAccess = false,
  userId,
  userEmail,
  videoSrc,
  className,
  seekRequestSeconds = null,
  onTimeUpdate,
  onProtectionViolation,
}: ProtectedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMinutes * 60);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<(typeof QUALITY_OPTIONS)[number]>("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [tokenReady, setTokenReady] = useState(isPreview);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL)
  );

  const isProtected = !isPreview;
  const wmConfig = watermarkConfig(userId ?? "guest", userEmail ?? "tamu@bursa.id");

  const chapterMarkers = useMemoChapterMarkers(duration);

  const revealControls = useCallback(() => {
    setShowControls(true);
  }, []);

  const logViolation = useCallback(
    (type: ProtectionViolationType) => {
      onProtectionViolation?.(type, lessonId);

      if (type === "screen_capture" || type === "print_screen" || type === "keyboard_shortcut") {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          setIsPlaying(false);
        }
        setShowWarning(true);
      }

      if (type === "tab_blur" && isProtected) {
        setIsBlurred(true);
      }
    },
    [isProtected, lessonId, onProtectionViolation]
  );

  useEffect(() => {
    if (isPreview) {
      setTokenReady(true);
      setTokenError(null);
      setPlaybackError(null);
      setResolvedSrc(resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL));
      return;
    }

    if (!userId) {
      setTokenReady(false);
      setTokenError("Masuk diperlukan untuk mengakses konten berbayar.");
      return;
    }

    let cancelled = false;
    setTokenReady(false);
    setTokenError(null);

    async function fetchToken() {
      try {
        const res = await fetch("/api/video/playback-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email: userEmail,
            courseId,
            lessonId,
            isPreview,
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          // Enrolled clients may race ahead of local enrollment sync; allow
          // playback when the workspace already confirmed course access.
          if (hasAccess && !cancelled) {
            generatePlaybackToken(userId!, lessonId);
            setResolvedSrc(resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL));
            setTokenReady(true);
            setTokenError(null);
            setPlaybackError(null);
            return;
          }
          if (!cancelled) setTokenError(data.error ?? "Gagal memuat video.");
          return;
        }

        const data = (await res.json()) as { token: string; videoUrl?: string };
        if (!cancelled) {
          generatePlaybackToken(userId!, lessonId);
          setResolvedSrc(resolvePlayableVideoUrl(data.videoUrl, videoSrc, DEMO_VIDEO_URL));
          setTokenReady(true);
          setTokenError(null);
          setPlaybackError(null);
        }
      } catch {
        if (!cancelled) {
          generatePlaybackToken(userId!, lessonId);
          setResolvedSrc(resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL));
          setTokenReady(true);
          setTokenError(null);
          setPlaybackError(null);
        }
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [courseId, hasAccess, isPreview, lessonId, userEmail, userId, videoSrc]);

  useEffect(() => {
    if (!isProtected || !containerRef.current) return;

    const cleanup = applyVideoProtection(containerRef.current, {
      blurOnFocusLoss: true,
      onViolation: logViolation,
    });

    return cleanup;
  }, [isProtected, logViolation, tokenReady]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(getFullscreenElement()) || isVideoFullscreen(videoRef.current));
    };

    const cleanups = [
      subscribeFullscreenChange(syncFullscreenState),
      subscribeVideoFullscreenChange(videoRef.current, syncFullscreenState),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [tokenReady]);

  useEffect(() => {
    const handleFocus = () => {
      if (isProtected) setIsBlurred(false);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && isProtected) setIsBlurred(false);
    });

    return () => window.removeEventListener("focus", handleFocus);
  }, [isProtected]);

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

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || playbackError) return;

    if (video.paused) {
      void video.play().then(
        () => setIsPlaying(true),
        () => {
          setIsPlaying(false);
          setPlaybackError("Video tidak dapat diputar. Periksa koneksi internet Anda atau coba lagi nanti.");
        }
      );
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [playbackError]);

  const handleVideoAreaTap = useCallback(() => {
    if (isPlaying) {
      revealControls();
      return;
    }
    togglePlay();
  }, [isPlaying, revealControls, togglePlay]);

  const handleVideoError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (resolvedSrc !== DEMO_VIDEO_URL) {
      setPlaybackError(null);
      setResolvedSrc(DEMO_VIDEO_URL);
      video.load();
      return;
    }

    video.pause();
    setIsPlaying(false);
    setPlaybackError(
      "Sumber video tidak tersedia atau format tidak didukung. Silakan muat ulang halaman atau hubungi dukungan."
    );
  }, [resolvedSrc]);

  useEffect(() => {
    if (seekRequestSeconds == null || !Number.isFinite(seekRequestSeconds)) return;
    const video = videoRef.current;
    if (!video) return;
    const max = getEffectiveDuration(video, duration);
    const next = Math.max(0, Math.min(max, Math.floor(seekRequestSeconds)));
    video.currentTime = next;
    setCurrentTime(next);
    onTimeUpdate?.(next);
    setShowControls(true);
    if (video.paused) {
      void video.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      );
    }
  }, [duration, seekRequestSeconds, onTimeUpdate]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    onTimeUpdate?.(video.currentTime);
  }, [onTimeUpdate]);

  const syncDuration = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    syncDuration();
  }, [syncDuration]);

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
      onTimeUpdate?.(video.currentTime);
    },
    [duration, onTimeUpdate]
  );

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      const max = getEffectiveDuration(video, duration);
      if (!video || max <= 0) return;
      const next = Math.max(0, Math.min(max, video.currentTime + deltaSeconds));
      video.currentTime = next;
      setCurrentTime(next);
      onTimeUpdate?.(next);
      revealControls();
    },
    [duration, onTimeUpdate, revealControls]
  );

  const handleProgressPointer = useCallback(
    (clientX: number) => {
      seekTo(clientX);
      revealControls();
    },
    [revealControls, seekTo]
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

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      await requestVideoFullscreen(container, videoRef.current);
    } catch {
      // Fullscreen may be blocked by browser policy or unsupported APIs.
    }
  }, []);

  const playerShellClass = cn(
    "aspect-video overflow-hidden rounded-xl border border-border",
    className
  );

  if (tokenError) {
    return (
      <div className={cn(playerShellClass, "flex items-center justify-center bg-surface p-6 text-center")}>
        <p className="text-sm text-muted-foreground">{tokenError}</p>
      </div>
    );
  }

  if (!tokenReady) {
    return (
      <div
        className={cn(
          playerShellClass,
          "flex items-center justify-center bg-gradient-to-br from-surface-2 via-surface to-background"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-xs text-muted-foreground">Memuat video...</p>
        </div>
      </div>
    );
  }

  if (playbackError) {
    return (
      <div className={cn(playerShellClass, "flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center")}>
        <p className="text-sm text-muted-foreground">{playbackError}</p>
        <button
          type="button"
          onClick={() => {
            setPlaybackError(null);
            setResolvedSrc(resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL));
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "video-player-shell group/player relative bg-black",
        playerShellClass,
        isProtected && "select-none [-webkit-touch-callout:none]",
        isBlurred && isProtected && "[&_video]:blur-xl"
      )}
      onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
    >
      <video
        ref={videoRef}
        key={resolvedSrc}
        src={resolvedSrc}
        className="size-full object-contain"
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={syncDuration}
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {isBlurred && isProtected && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/40 backdrop-blur-md">
          <p className="rounded-lg bg-black/60 px-4 py-2 text-sm text-white">
            Video disembunyikan — kembali ke tab ini untuk melanjutkan
          </p>
        </div>
      )}

      {isProtected && <VideoWatermark config={wmConfig} active={isProtected} />}

      {isProtected && (
        <Badge
          variant="outline"
          className="absolute left-3 top-3 z-30 border-white/20 bg-black/50 text-white backdrop-blur-sm"
        >
          <Shield className="size-3" />
          Konten Dilindungi
        </Badge>
      )}

      {isPreview && (
        <Badge
          variant="accent"
          className="absolute left-3 top-3 z-30 border-accent/30 bg-accent/20 text-accent-foreground backdrop-blur-sm"
        >
          <Sparkles className="size-3" />
          Preview Gratis
        </Badge>
      )}

      {isPlaying && (
        <button
          type="button"
          data-play-overlay
          onClick={handleVideoAreaTap}
          className="absolute inset-x-0 top-0 bottom-24 z-10 cursor-default bg-transparent"
          aria-label="Tampilkan kontrol video"
        />
      )}

      <div
        data-video-controls
        className={cn(
          "absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 sm:px-4",
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
          aria-label="Progres video"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className="relative h-3 w-full rounded-full bg-white/20 sm:h-1.5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-foreground/90 transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {chapterMarkers.map((marker) => (
              <div
                key={marker.label}
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60"
                style={{ left: `${marker.percent}%` }}
                title={marker.label}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekBy(-10);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-[11px] font-medium text-white transition-colors hover:bg-white/10 sm:hidden"
            aria-label="Mundur 10 detik"
          >
            -10s
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10"
            aria-label={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seekBy(10);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-[11px] font-medium text-white transition-colors hover:bg-white/10 sm:hidden"
            aria-label="Maju 10 detik"
          >
            +10s
          </button>

          <span className="min-w-[5.5rem] font-mono text-xs text-white/90 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-md p-1.5 text-white transition-colors hover:bg-white/10"
              aria-label={isMuted ? "Nyalakan suara" : "Bisukan"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="hidden h-1 w-16 cursor-pointer accent-white sm:block"
              aria-label="Volume"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-white/80">
              <span className="hidden sm:inline">Kecepatan</span>
              <select
                value={playbackSpeed}
                onChange={(e) => changeSpeed(Number(e.target.value))}
                className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5 text-xs text-white outline-none"
                aria-label="Kecepatan putar"
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1 text-xs text-white/80">
              <span className="hidden sm:inline">Kualitas</span>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as (typeof QUALITY_OPTIONS)[number])}
                className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5 text-xs text-white outline-none"
                aria-label="Kualitas video"
              >
                {QUALITY_OPTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void toggleFullscreen();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1.5 text-white transition-colors hover:bg-white/10"
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && !isBlurred && (
        <>
          <button
            type="button"
            data-play-overlay
            onClick={handleVideoAreaTap}
            className="absolute inset-x-0 top-0 bottom-24 z-10 bg-black/20 transition-opacity hover:bg-black/30"
            aria-label="Putar video"
          />
          <button
            type="button"
            data-play-overlay
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute left-1/2 top-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-[calc(50%+2rem)] items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform hover:scale-105 sm:-translate-y-1/2"
            aria-label="Putar video"
          >
            <Play className="size-8 text-white" />
          </button>
        </>
      )}

      {isProtected && (
        <ProtectionWarning open={showWarning} onDismiss={() => setShowWarning(false)} />
      )}

      <span className="sr-only">{lessonTitle}</span>
    </div>
  );
}

function useMemoChapterMarkers(duration: number) {
  return [
    { percent: 25, label: "Bab 1" },
    { percent: 50, label: "Bab 2" },
    { percent: 75, label: "Bab 3" },
  ].filter(() => duration > 0);
}
