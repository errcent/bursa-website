"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const SCROLL_CAROUSEL_GAP = 16;

/** One full item on the left + a partial peek of the next item on the right. */
export const CAROUSEL_PEEK_RATIO = 0.76;

export function peekGetScrollPerView(_width: number) {
  return 1;
}

export const defaultGetScrollPerView = peekGetScrollPerView;

/**
 * Responsive multi-up density for desktop course carousels (landing "Kelas
 * populer" + catalog instrument rows): ~2.4 cards at md, ~3.4 at lg, ~4.2 at
 * xl (container width, not viewport — carousels sit inside a max-width
 * container that caps out around 1152px). These functions are only ever
 * wired up to the `hidden md:block` desktop carousel branch — mobile uses a
 * separate CSS peek layout — so there is no "1 per view" case here.
 */
export function courseCarouselGetScrollPerView(width: number) {
  if (width >= 1100) return 4.2;
  if (width >= 900) return 3.4;
  if (width >= 620) return 2.4;
  return 1.6;
}

export const landingCourseGetScrollPerView = courseCarouselGetScrollPerView;
export const catalogCourseGetScrollPerView = courseCarouselGetScrollPerView;

/** Home discover section — slightly denser than landing/catalog, but still readable. */
export function discoverCourseGetScrollPerView(width: number) {
  if (width < 768) return 1;
  if (width >= 1100) return 4.6;
  if (width >= 900) return 3.8;
  if (width >= 620) return 2.8;
  return 2;
}

export function discoverMentorGetScrollPerView(width: number) {
  if (width < 768) return 1;
  if (width >= 1100) return 5.6;
  if (width >= 900) return 4.6;
  if (width >= 620) return 3.6;
  return 2.4;
}

/** Mobile peek for discover — smaller than default 0.76 but not cramped. */
export const DISCOVER_MOBILE_PEEK_RATIO = 0.68;

/**
 * Mentor tiles are narrower/simpler than course cards, so more fit per row:
 * ~3.2 at md, ~4.2 at lg, ~5.2 at xl. Also desktop-only, same reasoning as above.
 */
export function mentorCarouselGetScrollPerView(width: number) {
  if (width >= 1100) return 5.2;
  if (width >= 900) return 4.2;
  if (width >= 620) return 3.2;
  return 2.2;
}

export const mentorGetScrollPerView = mentorCarouselGetScrollPerView;

export const SCROLL_CAROUSEL_AUTOPLAY_INTERVAL_MS = 4500;
const SCROLL_CAROUSEL_AUTOPLAY_RESUME_MS = 8000;

export type ScrollCarouselHandle = {
  scrollByStep: (direction: -1 | 1) => void;
  scrollToIndex: (index: number) => void;
  pauseAutoPlay: () => void;
};

interface ScrollCarouselProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  viewportClassName?: string;
  getPerView?: (width: number) => number;
  /** Fraction of container width per item when only one card is shown (mobile peek). */
  mobilePeekRatio?: number;
  /** When set, each slide uses this CSS width instead of a computed per-view width. */
  fixedItemWidth?: string;
  /** Let each child define its own width (measured from layout). */
  naturalItemWidth?: boolean;
  gap?: number;
  /** Hide built-in edge arrow buttons (e.g. when using external header controls). */
  hideArrows?: boolean;
  onActiveIndexChange?: (index: number) => void;
  onScrollStateChange?: (state: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
  }) => void;
  /** Advance one slide on an interval; loops to the start at the end. */
  autoPlay?: boolean;
  autoPlayInterval?: number;
  /** When true, the timer does not advance (e.g. inactive discover tab). */
  autoPlayPaused?: boolean;
}

export const ScrollCarousel = forwardRef<ScrollCarouselHandle, ScrollCarouselProps>(
  function ScrollCarousel(
    {
      children,
      ariaLabel,
      className,
      viewportClassName,
      getPerView = defaultGetScrollPerView,
      mobilePeekRatio = CAROUSEL_PEEK_RATIO,
      fixedItemWidth,
      naturalItemWidth = false,
      gap = SCROLL_CAROUSEL_GAP,
      hideArrows = false,
      onActiveIndexChange,
      onScrollStateChange,
      autoPlay = false,
      autoPlayInterval = SCROLL_CAROUSEL_AUTOPLAY_INTERVAL_MS,
      autoPlayPaused = false,
    },
    ref
  ) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [itemWidth, setItemWidth] = useState<number | null>(null);
  const canScrollRightRef = useRef(canScrollRight);
  const autoPlayPausedRef = useRef(autoPlayPaused);
  const interactionPausedRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  canScrollRightRef.current = canScrollRight;
  autoPlayPausedRef.current = autoPlayPaused;

  const childItems = Children.toArray(children).filter(
    (child): child is ReactElement => isValidElement(child)
  );

  const updateScrollState = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const nextCanScrollLeft = scrollLeft > 2;
    const nextCanScrollRight = scrollLeft < scrollWidth - clientWidth - 2;
    setCanScrollLeft(nextCanScrollLeft);
    setCanScrollRight(nextCanScrollRight);
    onScrollStateChange?.({
      canScrollLeft: nextCanScrollLeft,
      canScrollRight: nextCanScrollRight,
    });

    if (onActiveIndexChange) {
      const firstItem = el.querySelector<HTMLElement>("[data-scroll-carousel-item]");
      const stride = firstItem ? firstItem.offsetWidth + gap : clientWidth;
      const index = Math.round(scrollLeft / Math.max(stride, 1));
      onActiveIndexChange(Math.min(Math.max(index, 0), childItems.length - 1));
    }
  }, [childItems.length, gap, onActiveIndexChange, onScrollStateChange]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      if (fixedItemWidth || naturalItemWidth) {
        const firstItem = el.querySelector<HTMLElement>("[data-scroll-carousel-item]");
        setItemWidth(firstItem?.offsetWidth ?? null);
        return;
      }

      const containerWidth = el.clientWidth;
      const perView = getPerView(containerWidth);
      const width =
        perView === 1
          ? containerWidth * mobilePeekRatio
          : (containerWidth - gap * (perView - 1)) / perView;
      setItemWidth(width);
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
      updateScrollState();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    fixedItemWidth,
    gap,
    getPerView,
    mobilePeekRatio,
    naturalItemWidth,
    updateScrollState,
    childItems.length,
  ]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState, itemWidth, childItems.length]);

  const scrollByStep = useCallback(
    (direction: -1 | 1) => {
      const el = viewportRef.current;
      if (!el) return;

      const firstItem = el.querySelector<HTMLElement>("[data-scroll-carousel-item]");
      const stride = firstItem
        ? firstItem.offsetWidth + gap
        : itemWidth !== null
          ? itemWidth + gap
          : el.clientWidth * 0.8;

      el.scrollBy({ left: direction * stride, behavior: "smooth" });
    },
    [gap, itemWidth]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = viewportRef.current;
      if (!el) return;

      const firstItem = el.querySelector<HTMLElement>("[data-scroll-carousel-item]");
      const stride = firstItem
        ? firstItem.offsetWidth + gap
        : itemWidth !== null
          ? itemWidth + gap
          : el.clientWidth * 0.8;

      el.scrollTo({ left: stride * index, behavior: "smooth" });
    },
    [gap, itemWidth]
  );

  const pauseAutoPlayForInteraction = useCallback(() => {
    interactionPausedRef.current = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      interactionPausedRef.current = false;
    }, SCROLL_CAROUSEL_AUTOPLAY_RESUME_MS);
  }, []);

  useImperativeHandle(
    ref,
    () => ({ scrollByStep, scrollToIndex, pauseAutoPlay: pauseAutoPlayForInteraction }),
    [scrollByStep, scrollToIndex, pauseAutoPlayForInteraction]
  );

  useEffect(() => {
    if (!autoPlay || childItems.length <= 1) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let intervalId: number | null = null;

    const tick = () => {
      if (
        autoPlayPausedRef.current ||
        interactionPausedRef.current ||
        hoverPausedRef.current ||
        document.hidden
      ) {
        return;
      }

      if (canScrollRightRef.current) {
        scrollByStep(1);
      } else {
        scrollToIndex(0);
      }
    };

    intervalId = window.setInterval(tick, autoPlayInterval);

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [autoPlay, autoPlayInterval, childItems.length, scrollByStep, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pauseAutoPlayForInteraction();
        scrollByStep(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        pauseAutoPlayForInteraction();
        scrollByStep(1);
      }
    },
    [pauseAutoPlayForInteraction, scrollByStep]
  );

  if (childItems.length === 0) return null;

  const canScrollAny = canScrollLeft || canScrollRight;
  const showArrows = !hideArrows && canScrollAny;

  return (
    <div
      className={cn("group/scroll-carousel relative w-full min-w-0 max-w-full", className)}
      onPointerEnter={() => {
        hoverPausedRef.current = true;
      }}
      onPointerLeave={() => {
        hoverPausedRef.current = false;
      }}
    >
      {canScrollAny && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-10 w-[var(--carousel-fade-width,2rem)] bg-gradient-to-r from-[var(--carousel-fade-color,var(--background))] via-[color-mix(in_oklch,var(--carousel-fade-color,var(--background))_55%,transparent)] to-transparent transition-opacity duration-300 sm:w-[var(--carousel-fade-width,2.5rem)]",
              canScrollLeft ? "opacity-100" : "opacity-0"
            )}
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 w-[var(--carousel-fade-width,2rem)] bg-gradient-to-l from-[var(--carousel-fade-color,var(--background))] via-[color-mix(in_oklch,var(--carousel-fade-color,var(--background))_55%,transparent)] to-transparent transition-opacity duration-300 sm:w-[var(--carousel-fade-width,2.5rem)]",
              canScrollRight ? "opacity-100" : "opacity-0"
            )}
            aria-hidden
          />
        </>
      )}

      {showArrows && canScrollLeft && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-border/80 bg-background/95 shadow-md backdrop-blur-sm sm:flex"
          onClick={() => scrollByStep(-1)}
          aria-label="Gulir ke kiri"
        >
          <ArrowLeft className="size-4" />
        </Button>
      )}

      {showArrows && canScrollRight && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border-border/80 bg-background/95 shadow-md backdrop-blur-sm sm:flex"
          onClick={() => scrollByStep(1)}
          aria-label="Gulir ke kanan"
        >
          <ArrowRight className="size-4" />
        </Button>
      )}

      <div
        ref={viewportRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={pauseAutoPlayForInteraction}
        onTouchStart={pauseAutoPlayForInteraction}
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className={cn(
          "catalog-scroll-carousel w-full min-w-0 max-w-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          viewportClassName
        )}
      >
        <div className="carousel-scroll-track flex pb-1" style={{ gap }}>
          {childItems.map((child) => (
            <div
              key={child.key ?? undefined}
              data-scroll-carousel-item
              className="catalog-scroll-carousel-item shrink-0 snap-start"
              style={
                naturalItemWidth
                  ? undefined
                  : {
                      width: fixedItemWidth ?? (itemWidth !== null ? itemWidth : undefined),
                      flexBasis: fixedItemWidth,
                    }
              }
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
