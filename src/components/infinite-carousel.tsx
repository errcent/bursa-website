"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from "motion/react";

import { cn } from "@/lib/utils";

export const DEFAULT_CAROUSEL_GAP = 16;
export const DEFAULT_AUTO_SCROLL_PX_PER_SEC = 42;
const RESUME_DELAY_MS = 900;
const RESUME_RAMP_MS = 700;

export function defaultGetPerView(width: number) {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function wrapOffset(value: number, setWidth: number) {
  if (setWidth <= 0) return value;
  let next = value;
  while (next <= -setWidth) next += setWidth;
  while (next > 0) next -= setWidth;
  return next;
}

export interface InfiniteCarouselSlideProps {
  index: number;
  itemWidth: number;
  containerWidth: number;
  x: MotionValue<number>;
  reducedMotion: boolean;
  gap: number;
}

export interface UseInfiniteCarouselOptions<T> {
  items: T[];
  ariaLabel: string;
  getPerView?: (width: number) => number;
  /** When set, each slide uses this CSS width (e.g. var(--landing-course-card-width)). */
  fixedItemWidth?: string | null;
  gap?: number;
  autoScrollPxPerSec?: number;
}

export function useInfiniteCarousel<T>({
  items,
  ariaLabel,
  getPerView = defaultGetPerView,
  fixedItemWidth = null,
  gap = DEFAULT_CAROUSEL_GAP,
  autoScrollPxPerSec = DEFAULT_AUTO_SCROLL_PX_PER_SEC,
}: UseInfiniteCarouselOptions<T>) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const x = useMotionValue(0);

  const [layout, setLayout] = useState({
    containerWidth: 0,
    itemWidth: 0,
    perView: 1,
  });
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const tabHiddenRef = useRef(false);
  const speedRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  const duplicated = [...items, ...items];

  const syncPaused = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPaused(value);
  }, []);

  const wrapX = useCallback(() => {
    const setWidth = setWidthRef.current;
    if (setWidth <= 0) return;
    const wrapped = wrapOffset(x.get(), setWidth);
    if (wrapped !== x.get()) x.set(wrapped);
  }, [x]);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      syncPaused(false);
    }, RESUME_DELAY_MS);
  }, [syncPaused]);

  const pauseInteraction = useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    syncPaused(true);
    speedRef.current = 0;
  }, [syncPaused]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const containerWidth = el.clientWidth;

      let itemWidth = 0;
      let perView = 1;

      if (fixedItemWidth) {
        const firstCard = el.querySelector<HTMLElement>("[data-carousel-card]");
        itemWidth = firstCard?.offsetWidth ?? 0;
        perView =
          itemWidth > 0 && containerWidth > 0
            ? Math.max(1, (containerWidth + gap) / (itemWidth + gap))
            : 1;
      } else {
        perView = getPerView(containerWidth);
        itemWidth =
          containerWidth > 0 ? (containerWidth - gap * (perView - 1)) / perView : 0;
      }

      setLayout({ containerWidth, itemWidth, perView });
      setWidthRef.current =
        items.length > 0 ? items.length * (itemWidth + gap) - gap : 0;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedItemWidth, gap, getPerView, items.length]);

  useEffect(() => {
    const syncVisibility = () => {
      tabHiddenRef.current = document.visibilityState === "hidden";
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    return x.on("change", (value) => {
      const setWidth = setWidthRef.current;
      if (setWidth <= 0) return;

      const stride = layout.itemWidth + gap;
      if (stride <= 0) return;

      const normalized =
        ((Math.abs(wrapOffset(value, setWidth)) % setWidth) + setWidth) % setWidth;
      const idx = Math.round(normalized / stride) % items.length;
      setActiveIndex(idx);
    });
  }, [gap, items.length, layout.itemWidth, x]);

  useAnimationFrame((_time, delta) => {
    if (prefersReducedMotion) return;

    const interacting =
      pausedRef.current || draggingRef.current || tabHiddenRef.current;
    const targetSpeed = interacting ? 0 : 1;

    speedRef.current += ((targetSpeed - speedRef.current) * delta) / RESUME_RAMP_MS;

    if (speedRef.current < 0.001 && interacting) return;

    const setWidth = setWidthRef.current;
    if (setWidth <= 0) return;

    const step = (autoScrollPxPerSec * speedRef.current * delta) / 1000;
    if (step === 0) return;

    x.set(wrapOffset(x.get() - step, setWidth));
  });

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const nudge = useCallback(
    (dir: -1 | 1) => {
      if (layout.itemWidth <= 0) return;
      pauseInteraction();
      scheduleResume();

      const stride = layout.itemWidth + gap;
      animate(x, x.get() + dir * stride, {
        type: "spring",
        stiffness: 280,
        damping: 30,
        mass: 0.85,
        onComplete: wrapX,
      });
    },
    [gap, layout.itemWidth, pauseInteraction, scheduleResume, wrapX, x]
  );

  const handleDragStart = () => {
    draggingRef.current = true;
    setDragging(true);
    pauseInteraction();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(-1);
      }
    },
    [nudge]
  );

  const handleDragEnd = (_event: PointerEvent, info: PanInfo) => {
    draggingRef.current = false;
    setDragging(false);
    wrapX();

    if (Math.abs(info.velocity.x) > 40) {
      animate(x, x.get() + info.velocity.x * 0.22, {
        type: "spring",
        stiffness: 120,
        damping: 22,
        mass: 0.9,
        velocity: info.velocity.x,
        onComplete: wrapX,
      });
    }

    scheduleResume();
  };

  const goToIndex = useCallback(
    (i: number) => {
      if (layout.itemWidth <= 0 || items.length === 0) return;
      pauseInteraction();
      scheduleResume();

      const setWidth = items.length * (layout.itemWidth + gap) - gap;
      const stride = layout.itemWidth + gap;
      const current = wrapOffset(x.get(), setWidth);
      const currentIdx =
        Math.round((Math.abs(current) % setWidth) / stride) % items.length;
      const delta = (i - currentIdx + items.length) % items.length;
      const shortest = delta > items.length / 2 ? delta - items.length : delta;

      animate(x, current - shortest * stride, {
        type: "spring",
        stiffness: 260,
        damping: 28,
        onComplete: wrapX,
      });
    },
    [gap, items.length, layout.itemWidth, pauseInteraction, scheduleResume, wrapX, x]
  );

  return {
    ariaLabel,
    items,
    duplicated,
    layout,
    gap,
    fixedItemWidth,
    x,
    activeIndex,
    paused,
    dragging,
    prefersReducedMotion,
    containerRef,
    dragControls,
    nudge,
    goToIndex,
    pauseInteraction,
    scheduleResume,
    draggingRef,
    handleKeyDown,
    handleDragStart,
    handleDragEnd,
    wrapX,
  };
}

export interface InfiniteCarouselViewportProps<T> {
  carousel: ReturnType<typeof useInfiniteCarousel<T>>;
  getItemKey: (item: T, index: number) => string;
  renderSlide: (item: T, slideProps: InfiniteCarouselSlideProps) => ReactNode;
  className?: string;
  dotsClassName?: string;
  getDotLabel?: (index: number) => string;
  liveRegionLabel?: (index: number, item: T) => string;
}

export function InfiniteCarouselViewport<T>({
  carousel,
  getItemKey,
  renderSlide,
  className,
  dotsClassName,
  getDotLabel = (index) => `Ke item ${index + 1}`,
  liveRegionLabel,
}: InfiniteCarouselViewportProps<T>) {
  const {
    ariaLabel,
    items,
    duplicated,
    layout,
    gap,
    fixedItemWidth,
    x,
    activeIndex,
    paused,
    dragging,
    prefersReducedMotion,
    containerRef,
    dragControls,
    goToIndex,
    pauseInteraction,
    scheduleResume,
    draggingRef,
    handleKeyDown,
    handleDragStart,
    handleDragEnd,
    wrapX,
  } = carousel;

  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        className="group/carousel relative touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
        onMouseEnter={pauseInteraction}
        onMouseLeave={() => {
          if (!draggingRef.current) scheduleResume();
        }}
        onFocusCapture={pauseInteraction}
        onBlurCapture={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            scheduleResume();
          }
        }}
        onKeyDown={handleKeyDown}
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {items[activeIndex]
            ? liveRegionLabel
              ? liveRegionLabel(activeIndex, items[activeIndex])
              : `Item ${activeIndex + 1} dari ${items.length}`
            : null}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background via-background/80 to-transparent sm:w-14"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background via-background/80 to-transparent sm:w-14"
          aria-hidden
        />

        <div className="overflow-hidden">
          <motion.div
            className={cn(
              "flex",
              dragging ? "cursor-grabbing" : "cursor-grab",
              !prefersReducedMotion && !paused && "motion-safe:transition-none"
            )}
            style={{ x, gap, touchAction: "pan-y" }}
            drag={prefersReducedMotion ? false : "x"}
            dragControls={dragControls}
            dragListener={false}
            dragElastic={0.04}
            dragMomentum={false}
            onPointerDown={(e) => {
              if (prefersReducedMotion) return;
              if ((e.target as HTMLElement).closest("[data-carousel-card]")) return;
              dragControls.start(e);
            }}
            onDragStart={handleDragStart}
            onDrag={wrapX}
            onDragEnd={handleDragEnd}
            whileTap={prefersReducedMotion ? undefined : { cursor: "grabbing" }}
          >
            {duplicated.map((item, i) => (
              <div
                key={getItemKey(item, i)}
                data-carousel-card
                className="shrink-0"
                style={
                  fixedItemWidth
                    ? { width: fixedItemWidth }
                    : layout.itemWidth > 0
                      ? { width: layout.itemWidth }
                      : undefined
                }
              >
                {renderSlide(item, {
                  index: i,
                  itemWidth: layout.itemWidth,
                  containerWidth: layout.containerWidth,
                  x,
                  reducedMotion: prefersReducedMotion,
                  gap,
                })}
              </div>
            ))}
          </motion.div>
        </div>

        {!prefersReducedMotion && (
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity duration-500 group-hover/carousel:opacity-100"
            aria-hidden
          />
        )}
      </div>

      {items.length > 1 && (
        <div
          className={cn(
            "mt-5 flex items-center justify-center gap-1.5 sm:justify-start",
            dotsClassName
          )}
        >
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              aria-label={getDotLabel(i)}
              aria-current={i === activeIndex ? "true" : undefined}
              className="flex size-11 items-center justify-center rounded-full"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300 ease-out",
                  i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-accent/40"
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
