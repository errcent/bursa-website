"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Shield } from "lucide-react";

import { ProtectionWarning } from "@/components/video/protection-warning";
import {
  DEFAULT_QUALITY_OPTIONS,
  VideoControlBar,
  type VideoQualityValue,
} from "@/components/video/video-control-bar";
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
  type ProtectionViolationType,
  watermarkConfig,
} from "@/lib/video/protection";
import { DEMO_VIDEO_URL, resolvePlayableVideoUrl } from "@/lib/video/demo";

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
  /** Device mockup — skip DRM/blur/watermark and use demo playback. */
  mockupMode?: boolean;
  /** Inset fullscreen for device mockup scroll (not browser Fullscreen API). */
  simulatedFullscreen?: boolean;
  /** Pulse the fullscreen control (mockup scroll cue). */
  highlightFullscreenControl?: boolean;
  /** Auto-play video in mockup demos. */
  mockupAutoPlay?: boolean;
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
  mockupMode = false,
  simulatedFullscreen = false,
  highlightFullscreenControl = false,
  mockupAutoPlay = false,
}: ProtectedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Signed server heartbeat token — enables verified watch-time accrual (QC-20260719-46). */
  const heartbeatTokenRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationMinutes * 60);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState<VideoQualityValue>("Auto");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [hasSubtitleTracks, setHasSubtitleTracks] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [tokenReady, setTokenReady] = useState(isPreview || mockupMode);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL)
  );

  const usesDemoPlayback = isPreview || mockupMode;
  const playbackSrc = usesDemoPlayback
    ? resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL)
    : resolvedSrc;
  const isPlaybackReady = usesDemoPlayback || tokenReady;

  const isProtected = !isPreview && !mockupMode;
  const wmConfig = watermarkConfig(userId ?? "guest", userEmail ?? "tamu@bursanalar.com");

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
    if (usesDemoPlayback) return;

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
          credentials: "include",
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
          if (hasAccess && !cancelled) {
            setResolvedSrc(resolvePlayableVideoUrl(videoSrc, DEMO_VIDEO_URL));
            setTokenReady(true);
            setTokenError(null);
            setPlaybackError(null);
            return;
          }
          if (!cancelled) setTokenError(data.error ?? "Gagal memuat video.");
          return;
        }

        const data = (await res.json()) as {
          token: string;
          videoUrl?: string;
          heartbeatToken?: string;
        };
        if (!cancelled) {
          heartbeatTokenRef.current = data.heartbeatToken ?? null;
          setResolvedSrc(resolvePlayableVideoUrl(data.videoUrl, videoSrc, DEMO_VIDEO_URL));
          setTokenReady(true);
          setTokenError(null);
          setPlaybackError(null);
        }
      } catch {
        if (!cancelled) {
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
  }, [courseId, hasAccess, lessonId, userEmail, userId, usesDemoPlayback, videoSrc]);

  const controlsVisible = mockupMode || showControls;

  // Server-verified watch time (QC-20260719-46): while an enrolled learner is playing, ping the
  // heartbeat endpoint with the current playhead so the server can accrue verified watch time.
  // Guests / previews don't accrue. Completion elsewhere is gated on this server value.
  useEffect(() => {
    if (isPreview || !isPlaying || !userId) return;
    const token = heartbeatTokenRef.current;
    if (!token) return;

    let cancelled = false;
    const sendHeartbeat = () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      void fetch("/api/video/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userEmail ? { "x-user-email": userEmail } : {}),
        },
        body: JSON.stringify({
          userId,
          token,
          lessonId,
          position: Math.floor(video.currentTime),
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, 15_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isPlaying, isPreview, userId, userEmail, lessonId]);

  useEffect(() => {
    if (!isProtected || !containerRef.current) return;

    const cleanup = applyVideoProtection(containerRef.current, {
      blurOnFocusLoss: true,
      onViolation: logViolation,
    });

    return cleanup;
  }, [isProtected, isPlaybackReady, logViolation]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(getFullscreenElement()) || isVideoFullscreen(videoRef.current));
    };

    const cleanups = [
      subscribeFullscreenChange(syncFullscreenState),
      subscribeVideoFullscreenChange(videoRef.current, syncFullscreenState),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isPlaybackReady]);

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
    if (mockupMode) return;

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
  }, [isPlaying, mockupMode]);

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
  }, [playbackSrc, isPlaybackReady]);

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
    if (isPlaying && showControls) {
      setShowControls(false);
      return;
    }
    revealControls();
  }, [isPlaying, revealControls, showControls]);

  const handleVideoError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playbackSrc !== DEMO_VIDEO_URL) {
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
  }, [playbackSrc]);

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

  useEffect(() => {
    if (!mockupMode || !mockupAutoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  }, [mockupMode, mockupAutoPlay, playbackSrc, simulatedFullscreen]);

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
      onTimeUpdate?.(video.currentTime);
    },
    [duration, onTimeUpdate]
  );

  const handleSeek = useCallback(
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

  const handleQualityChange = useCallback((nextQuality: VideoQualityValue) => {
    setQuality(nextQuality);
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
    !simulatedFullscreen && "aspect-video overflow-hidden rounded-xl border border-border",
    simulatedFullscreen && "h-full min-h-0 overflow-hidden rounded-none border-0",
    className,
  );

  if (tokenError) {
    return (
      <div className={cn(playerShellClass, "flex items-center justify-center bg-surface p-6 text-center")}>
        <p className="text-sm text-muted-foreground">{tokenError}</p>
      </div>
    );
  }

  if (!isPlaybackReady) {
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
        isBlurred && isProtected && "[&_video]:blur-xl",
        simulatedFullscreen && "video-player-shell--simulated-fullscreen",
      )}
      onContextMenu={isProtected ? (e) => e.preventDefault() : undefined}
    >
      <video
        ref={videoRef}
        key={playbackSrc}
        src={playbackSrc}
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

      <button
        type="button"
        onClick={handleVideoAreaTap}
        className="absolute inset-0 z-10 cursor-default bg-transparent"
        aria-label={isPlaying ? "Tampilkan atau sembunyikan kontrol" : "Tampilkan kontrol video"}
      />

      <VideoControlBar
        isPlaying={isPlaying}
        showControls={controlsVisible}
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
        isFullscreen={simulatedFullscreen || isFullscreen}
        subtitlesEnabled={subtitlesEnabled}
        hasSubtitleTracks={hasSubtitleTracks}
        chapterMarkers={chapterMarkers}
        highlightFullscreenControl={highlightFullscreenControl}
        onRevealControls={revealControls}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
        onChangeSpeed={changeSpeed}
        onChangeQuality={handleQualityChange}
        onToggleSubtitles={toggleSubtitles}
        onToggleFullscreen={toggleFullscreen}
      />

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
