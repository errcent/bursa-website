"use client";

import { useRef, useState, type ReactNode } from "react";

import {
  DiscoverInfiniteCarousel,
  type InfiniteCarouselHandle,
} from "@/components/infinite-carousel";
import { peekGetScrollPerView } from "@/components/scroll-carousel";
import { cn } from "@/lib/utils";

/** One landscape card + peek of the next on mobile. */
const GUIDANCE_PICK_PEEK_RATIO = 0.56;
const GUIDANCE_PICK_GAP = 14;

export function GuidancePickCarousel<T>({
  items,
  ariaLabel,
  getItemKey,
  getReason,
  renderCard,
  singleItemClassName,
  className,
}: {
  items: T[];
  ariaLabel: string;
  getItemKey: (item: T) => string;
  getReason: (item: T) => string | undefined;
  renderCard: (item: T) => ReactNode;
  singleItemClassName?: string;
  className?: string;
}) {
  const carouselRef = useRef<InfiniteCarouselHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const activeReason = getReason(items[activeIndex]!);

  if (items.length === 1) {
    const reason = getReason(items[0]!);
    return (
      <div className={cn("mx-auto flex w-full max-w-xl flex-col gap-3", singleItemClassName, className)}>
        {renderCard(items[0]!)}
        {reason ? (
          <p className="px-2 text-center text-xs leading-relaxed text-muted-foreground">{reason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <div className="guidance-pick-carousel-bleed relative z-[1] min-w-0">
        <DiscoverInfiniteCarousel
          ref={carouselRef}
          items={items}
          ariaLabel={ariaLabel}
          getPerView={peekGetScrollPerView}
          gap={GUIDANCE_PICK_GAP}
          mobilePeekRatio={GUIDANCE_PICK_PEEK_RATIO}
          allowDragFromSlides
          coverflow
          onActiveIndexChange={setActiveIndex}
          getItemKey={getItemKey}
          renderItem={(item) => (
            <div className="flex w-full flex-col">{renderCard(item)}</div>
          )}
        />
      </div>

      <div className="relative z-[1] mt-3 min-h-[1.25rem] px-4">
        {activeReason ? (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">{activeReason}</p>
        ) : null}
      </div>

      <div
        className="relative z-[1] mt-4 flex items-center justify-center gap-3"
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
            onClick={() => carouselRef.current?.goToIndex(index)}
            className="carousel-dot"
          />
        ))}
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {activeIndex + 1}/{items.length}
        </span>
      </div>
    </div>
  );
}
