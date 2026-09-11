"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { CarouselNavButtons } from "@/components/carousel-nav-buttons";
import {
  DiscoverInfiniteCarousel,
  type InfiniteCarouselHandle,
} from "@/components/infinite-carousel";
import {
  DISCOVER_MOBILE_PEEK_RATIO,
  SCROLL_CAROUSEL_GAP,
  discoverCoverflowGetScrollPerView,
} from "@/components/scroll-carousel";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import { cn } from "@/lib/utils";

const LANDING_MOBILE_GAP = 10;

export function GuidancePickCarousel<T>({
  items,
  ariaLabel,
  getItemKey,
  getReason,
  renderCard,
  singleItemClassName,
  className,
  sectionTitle,
  sectionLink,
  getPerView = discoverCoverflowGetScrollPerView,
  mobilePeekRatio = DISCOVER_MOBILE_PEEK_RATIO,
  bleedClassName = "discover-carousel-bleed",
}: {
  items: T[];
  ariaLabel: string;
  getItemKey: (item: T) => string;
  getReason: (item: T) => string | undefined;
  renderCard: (item: T) => ReactNode;
  singleItemClassName?: string;
  className?: string;
  sectionTitle?: string;
  sectionLink?: ReactNode;
  getPerView?: (width: number) => number;
  mobilePeekRatio?: number;
  bleedClassName?: string;
}) {
  const isMobile = useMobileLayout();
  const carouselRef = useRef<InfiniteCarouselHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollByStep = useCallback((direction: -1 | 1) => {
    carouselRef.current?.pauseInteraction();
    carouselRef.current?.nudge(direction === 1 ? -1 : 1);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    carouselRef.current?.pauseInteraction();
    carouselRef.current?.goToIndex(index);
  }, []);

  if (items.length === 0) return null;

  const activeReason = getReason(items[activeIndex]!);
  const infiniteScroll = items.length > 1;

  if (items.length === 1) {
    const reason = getReason(items[0]!);
    return (
      <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-3", singleItemClassName, className)}>
        {renderCard(items[0]!)}
        {reason ? (
          <p className="guidance-balanced-copy mx-auto max-w-[34ch] px-2 text-center text-sm leading-relaxed text-muted-foreground">
            {reason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("course-carousel-premium relative min-w-0", className)}>
      {sectionTitle ? (
        <div className="relative z-[1] mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="section-title">{sectionTitle}</h3>
            {sectionLink}
          </div>
          <CarouselNavButtons
            canScrollLeft={infiniteScroll}
            canScrollRight={infiniteScroll}
            onPrev={() => scrollByStep(-1)}
            onNext={() => scrollByStep(1)}
            prevLabel={`${ariaLabel} sebelumnya`}
            nextLabel={`${ariaLabel} berikutnya`}
          />
        </div>
      ) : null}

      <div className={cn("relative z-[1] min-w-0", bleedClassName)}>
        <DiscoverInfiniteCarousel
          ref={carouselRef}
          items={items}
          ariaLabel={ariaLabel}
          getPerView={getPerView}
          gap={isMobile ? LANDING_MOBILE_GAP : SCROLL_CAROUSEL_GAP}
          mobilePeekRatio={mobilePeekRatio}
          allowDragFromSlides
          coverflow
          onActiveIndexChange={setActiveIndex}
          getItemKey={getItemKey}
          renderItem={(item) => (
            <div className="flex w-full flex-col">{renderCard(item)}</div>
          )}
        />
      </div>

      {activeReason ? (
        <p className="guidance-balanced-copy relative z-[1] mx-auto mt-5 max-w-[34ch] px-2 text-center text-sm leading-relaxed text-muted-foreground">
          {activeReason}
        </p>
      ) : null}

      <div className="relative z-[1] mt-6 flex items-center justify-center gap-3 sm:mt-8">
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label={`Navigasi ${ariaLabel}`}
        >
          {items.map((item, index) => (
            <button
              key={getItemKey(item)}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-current={index === activeIndex}
              aria-label={`Item ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className="carousel-dot"
            />
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {activeIndex + 1}/{items.length}
        </span>
      </div>
    </div>
  );
}
