"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, GripHorizontal, Pause, Play, X } from "lucide-react";

import { cn } from "@/lib/utils";

const SWIPE_DOMINANCE = 1.15;
const MINI_MARGIN = 10;
const MINI_BOTTOM_SAFE = 72;
const MINI_RADIUS = 14;
const MINI_WIDTH_MIN = 128;
const MINI_WIDTH_MAX = 168;
const MINI_WIDTH_RATIO = 0.44;
const FLOAT_WIDTH_MAX_RATIO = 0.92;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export type MobilePlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
};

type MobileLessonMiniPlayerShellProps = {
  children: React.ReactNode;
  onCollapseProgress: (progress: number) => void;
  playback: MobilePlaybackState;
  onTogglePlay: () => void;
  /** Mobile top-left: leave lesson (return path / mini player). */
  onRequestExit?: () => void;
  /** In-player chrome (back chevron) follows video control visibility. */
  overlayChromeVisible?: boolean;
  /** Notes studio: skip slot height transition (keyboard resize). */
  suppressSlotTransition?: boolean;
  className?: string;
};

type GestureMode = "idle" | "collapse" | "float-move" | "float-resize" | "float-expand";

export function MobileLessonMiniPlayerShell({
  children,
  onCollapseProgress,
  playback,
  onTogglePlay,
  onRequestExit,
  overlayChromeVisible = true,
  suppressSlotTransition = false,
  className,
}: MobileLessonMiniPlayerShellProps) {
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [floatWidth, setFloatWidth] = useState<number | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const gesture = useRef<GestureMode>("idle");
  const startRef = useRef({ x: 0, y: 0, progress: 0, floatX: 0, floatY: 0, floatW: 0 });
  const dominantVertical = useRef(false);
  const capturePointer = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
    onCollapseProgress(progress);
  }, [onCollapseProgress, progress]);

  const docked = progress >= 0.96;

  const defaultMiniW = (vw: number) =>
    clamp(Math.min(MINI_WIDTH_MAX, vw * MINI_WIDTH_RATIO), MINI_WIDTH_MIN, vw * FLOAT_WIDTH_MAX_RATIO);

  const getMiniMetrics = useCallback(
    (vw: number, vh: number) => {
      const miniW = floatWidth ?? defaultMiniW(vw);
      const miniH = miniW * (9 / 16);
      const anchorX = vw - miniW - MINI_MARGIN;
      const anchorY = vh - miniH - MINI_BOTTOM_SAFE;
      return { miniW, miniH, anchorX, anchorY };
    },
    [floatWidth]
  );

  const animateTo = useCallback((target: number) => {
    gesture.current = "idle";
    setIsDragging(false);
    setProgress(target);
    progressRef.current = target;
    if (target < 0.96) {
      setFloatPos(null);
      setFloatWidth(null);
    }
  }, []);

  const releaseCapture = useCallback((pointerId: number) => {
    if (capturePointer.current === pointerId) {
      shellRef.current?.releasePointerCapture(pointerId);
      capturePointer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      if (event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest("[data-float-resize]")) {
        gesture.current = "float-resize";
        setIsDragging(true);
        const { miniW } = getMiniMetrics(viewport.width, viewport.height);
        startRef.current = {
          x: event.clientX,
          y: event.clientY,
          progress: progressRef.current,
          floatX: floatPos?.x ?? 0,
          floatY: floatPos?.y ?? 0,
          floatW: floatWidth ?? miniW,
        };
        shellRef.current?.setPointerCapture(event.pointerId);
        capturePointer.current = event.pointerId;
        return;
      }

      if (docked && target.closest("[data-float-drag]")) {
        gesture.current = "float-move";
        setIsDragging(true);
        const { anchorX, anchorY } = getMiniMetrics(viewport.width, viewport.height);
        startRef.current = {
          x: event.clientX,
          y: event.clientY,
          progress: progressRef.current,
          floatX: floatPos?.x ?? anchorX,
          floatY: floatPos?.y ?? anchorY,
          floatW: 0,
        };
        shellRef.current?.setPointerCapture(event.pointerId);
        capturePointer.current = event.pointerId;
        return;
      }

      if (target.closest("[data-lesson-back]")) return;

      const interactive = target.closest(
        "button, a, input, textarea, [role='slider']"
      ) as HTMLElement | null;
      if (interactive && !interactive.classList.contains("video-tap-capture")) return;

      if (docked) {
        gesture.current = "float-expand";
        setIsDragging(true);
        startRef.current = {
          x: event.clientX,
          y: event.clientY,
          progress: progressRef.current,
          floatX: 0,
          floatY: 0,
          floatW: 0,
        };
        dominantVertical.current = false;
        return;
      }

      // Fullscreen: no swipe-down to minimize — use top-left chevron only.
      gesture.current = "idle";
    },
    [docked, floatPos, floatWidth, getMiniMetrics, viewport.height, viewport.width]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const mode = gesture.current;
      if (mode === "idle") return;

      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;

      if (mode === "float-move") {
        event.preventDefault();
        const { miniW, miniH } = getMiniMetrics(viewport.width, viewport.height);
        const x = clamp(startRef.current.floatX + dx, MINI_MARGIN, viewport.width - miniW - MINI_MARGIN);
        const y = clamp(
          startRef.current.floatY + dy,
          MINI_MARGIN,
          viewport.height - miniH - MINI_MARGIN
        );
        setFloatPos({ x, y });
        return;
      }

      if (mode === "float-resize") {
        event.preventDefault();
        const vw = viewport.width;
        const nextW = clamp(
          startRef.current.floatW + dx * 1.15,
          MINI_WIDTH_MIN,
          vw * FLOAT_WIDTH_MAX_RATIO
        );
        setFloatWidth(nextW);
        return;
      }

      if (mode === "float-expand") {
        if (!dominantVertical.current) {
          if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
          dominantVertical.current = Math.abs(dy) >= Math.abs(dx) * SWIPE_DOMINANCE;
          if (!dominantVertical.current) {
            gesture.current = "idle";
            setIsDragging(false);
            return;
          }
        }
        if (dy < -24) {
          animateTo(0);
          return;
        }
        if (dy > 12) return;
        return;
      }

      if (mode === "collapse") return;
    },
    [animateTo, getMiniMetrics, viewport.height, viewport.width]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const mode = gesture.current;
      if (mode === "idle" && !isDragging) return;

      releaseCapture(event.pointerId);

      if (mode === "float-expand" && dominantVertical.current && event.clientY - startRef.current.y < -48) {
        animateTo(0);
      }

      gesture.current = "idle";
      dominantVertical.current = false;
      setIsDragging(false);
    },
    [animateTo, isDragging, releaseCapture]
  );

  const t = easeOutCubic(progress);
  const vw = viewport.width;
  const vh = viewport.height;
  const fullW = vw;
  const fullH = fullW * (9 / 16);
  const { miniW, miniH, anchorX, anchorY } = getMiniMetrics(vw, vh);

  const width = lerp(fullW, miniW, t);
  const height = lerp(fullH, miniH, t);
  const animLeft = lerp(0, anchorX, t);
  const animTop = lerp(0, anchorY, t);
  const left = docked && floatPos ? floatPos.x : animLeft;
  const top = docked && floatPos ? floatPos.y : animTop;
  const radius = lerp(0, MINI_RADIUS, t);
  const isFloating = progress > 0.02;
  const placeholderHeight = isFloating ? lerp(fullH, 0, t) : fullH;
  const scrimAlpha = docked ? 0 : t * 0.32;

  const duration = Math.max(playback.duration, 1);
  const playedRatio = clamp(playback.currentTime / duration, 0, 1);
  const showMiniChrome = progress > 0.22;

  const transition = isDragging
    ? undefined
    : "width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), left 280ms cubic-bezier(0.22, 1, 0.36, 1), top 280ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms ease-out";

  useEffect(() => {
    if (!docked) return;
    setFloatPos((prev) => prev ?? { x: anchorX, y: anchorY });
  }, [docked, anchorX, anchorY]);

  return (
    <div className={cn("w-full max-lg:max-w-none lg:w-auto", className)}>
      {scrimAlpha > 0.01 ? (
        <div
          aria-hidden
          data-lesson-scrim
          className="pointer-events-none fixed inset-0 z-40 max-lg:block lg:hidden"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${scrimAlpha})`,
            transition: isDragging ? undefined : "background-color 280ms ease-out",
          }}
        />
      ) : null}

      <div
        data-lesson-video-slot
        className="relative w-full max-lg:h-[var(--lesson-slot-h)] lg:h-auto"
        style={
          {
            ["--lesson-slot-h" as string]: `${placeholderHeight}px`,
            transition:
              isDragging || suppressSlotTransition
                ? undefined
                : "height 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          } as CSSProperties
        }
      >
        <div
          ref={shellRef}
          className={cn(
            "overflow-hidden bg-black",
            isFloating
              ? "fixed z-50 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
              : "absolute inset-0 lg:relative lg:inset-auto lg:h-auto lg:w-full lg:shadow-none"
          )}
          style={
            isFloating
              ? {
                  width,
                  height,
                  left,
                  top,
                  borderRadius: radius,
                  transition,
                }
              : {
                  borderRadius: 0,
                  transition: isDragging ? undefined : "border-radius 220ms ease-out",
                }
          }
          onPointerDownCapture={onPointerDown}
          onPointerMoveCapture={onPointerMove}
          onPointerUpCapture={onPointerUp}
          onPointerCancelCapture={onPointerUp}
        >
          <div
            className="relative size-full overflow-hidden bg-black"
            style={{ borderRadius: isFloating ? radius : 0 }}
          >
            {children}

            {!docked && !showMiniChrome ? (
              <button
                type="button"
                data-lesson-back
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRequestExit) {
                    onRequestExit();
                    return;
                  }
                  animateTo(1);
                }}
                className={cn(
                  "pointer-events-auto absolute left-2 top-2 z-[50] inline-flex size-9 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-[opacity,transform] will-change-[opacity,transform] hover:bg-black/70 lg:hidden",
                  overlayChromeVisible
                    ? "scale-100 opacity-100 duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    : "pointer-events-none scale-[0.92] opacity-0 duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                )}
                aria-label="Kembali ke halaman sebelumnya"
                aria-hidden={!overlayChromeVisible}
                tabIndex={overlayChromeVisible ? 0 : -1}
              >
                <ChevronDown className="size-5" strokeWidth={2.25} aria-hidden />
              </button>
            ) : null}

            {showMiniChrome ? (
              <div className="absolute inset-0 z-[35] flex flex-col justify-between lg:hidden">
                <div
                  data-float-drag
                  className="flex cursor-grab items-start justify-between p-1.5 active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlay();
                    }}
                    className="inline-flex size-8 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm"
                    aria-label={playback.isPlaying ? "Jeda" : "Putar"}
                  >
                    {playback.isPlaying ? (
                      <Pause className="size-4" aria-hidden />
                    ) : (
                      <Play className="size-4 pl-0.5" aria-hidden />
                    )}
                  </button>
                  <div className="pointer-events-none flex flex-1 justify-center pt-1">
                    <GripHorizontal className="size-4 text-white/45" aria-hidden />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      animateTo(0);
                    }}
                    className="inline-flex size-8 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm"
                    aria-label="Tutup mini player"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="px-2 pb-2 pt-4">
                  <div className="h-1 overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white/90 transition-[width] duration-150"
                      style={{ width: `${playedRatio * 100}%` }}
                    />
                  </div>
                </div>
                {docked ? (
                  <div
                    data-float-resize
                    className="absolute bottom-1 right-1 z-40 size-6 cursor-se-resize rounded-sm bg-white/20 backdrop-blur-sm"
                    aria-hidden
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
}
