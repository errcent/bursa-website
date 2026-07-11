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

export function defaultGetScrollPerView(width: number) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function mentorGetScrollPerView(width: number) {
  if (width >= 1280) return 6;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

export function landingCourseGetScrollPerView(width: number) {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

/** Katalog grouped rows on desktop — tighter than landing carousels. */
export function catalogCourseGetScrollPerView(width: number) {
  if (width >= 1536) return 5;
  if (width >= 1280) return 4;
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
}

export type ScrollCarouselHandle = {
  scrollByStep: (direction: -1 | 1) => void;
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
}

export const ScrollCarousel = forwardRef<ScrollCarouselHandle, ScrollCarouselProps>(
  function ScrollCarousel(
    {
      children,
      ariaLabel,
      className,
      viewportClassName,
      getPerView = defaultGetScrollPerView,
      mobilePeekRatio = 0.86,
      fixedItemWidth,
      naturalItemWidth = false,
      gap = SCROLL_CAROUSEL_GAP,
      hideArrows = false,
      onActiveIndexChange,
      onScrollStateChange,
    },
    ref
  ) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [itemWidth, setItemWidth] = useState<number | null>(null);

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

  useImperativeHandle(ref, () => ({ scrollByStep }), [scrollByStep]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByStep(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByStep(1);
      }
    },
    [scrollByStep]
  );

  if (childItems.length === 0) return null;

  const showArrows = !hideArrows && (canScrollLeft || canScrollRight);

  return (
    <div className={cn("group/scroll-carousel relative w-full min-w-0 max-w-full", className)}>
      {showArrows && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 bg-gradient-to-r from-background via-background/85 to-transparent sm:block sm:w-16"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-l from-background via-background/85 to-transparent sm:block sm:w-16"
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
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className={cn(
          "catalog-scroll-carousel w-full min-w-0 max-w-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          viewportClassName
        )}
      >
        <div className="flex pb-1" style={{ gap }}>
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
