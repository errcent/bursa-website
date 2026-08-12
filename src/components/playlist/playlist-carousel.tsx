"use client";

import { CarouselNavButtons } from "@/components/carousel-nav-buttons";
import {
  DiscoverInfiniteCarousel,
  type InfiniteCarouselHandle,
} from "@/components/infinite-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import {
  DISCOVER_MOBILE_PEEK_RATIO,
  SCROLL_CAROUSEL_GAP,
  discoverCoverflowGetScrollPerView,
} from "@/components/scroll-carousel";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { PlaylistSummary } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

const LANDING_MOBILE_GAP = 10;

interface PlaylistCarouselProps {
  playlists: PlaylistSummary[];
  className?: string;
  hideBookmark?: boolean;
  discoverMode?: boolean;
  autoPlayPaused?: boolean;
}

export function PlaylistCarousel({
  playlists,
  className,
  hideBookmark = false,
  discoverMode = false,
  autoPlayPaused = false,
}: PlaylistCarouselProps) {
  const isMobile = useMobileLayout();
  const discoverCarouselRef = useRef<InfiniteCarouselHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollByStep = useCallback((direction: -1 | 1) => {
    discoverCarouselRef.current?.pauseInteraction();
    discoverCarouselRef.current?.nudge(direction === 1 ? -1 : 1);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    discoverCarouselRef.current?.pauseInteraction();
    discoverCarouselRef.current?.goToIndex(index);
  }, []);

  if (playlists.length === 0 || !discoverMode) return null;

  const infiniteScroll = playlists.length > 1;

  return (
    <div
      className={cn(
        "course-carousel-premium relative min-w-0",
        discoverMode && "discover-carousel-panel",
        className
      )}
    >
      <div className="relative z-[1] mb-6 flex justify-end sm:mb-8">
        <CarouselNavButtons
          canScrollLeft={infiniteScroll}
          canScrollRight={infiniteScroll}
          onPrev={() => scrollByStep(-1)}
          onNext={() => scrollByStep(1)}
          prevLabel="Playlist sebelumnya"
          nextLabel="Playlist berikutnya"
        />
      </div>

      <div className="relative z-[1] discover-carousel-bleed min-w-0">
        <DiscoverInfiniteCarousel
          ref={discoverCarouselRef}
          items={playlists}
          ariaLabel="Ragam playlist di Bursa"
          getPerView={discoverCoverflowGetScrollPerView}
          gap={isMobile ? LANDING_MOBILE_GAP : SCROLL_CAROUSEL_GAP}
          mobilePeekRatio={DISCOVER_MOBILE_PEEK_RATIO}
          autoPlayPaused={autoPlayPaused}
          onActiveIndexChange={setActiveIndex}
          getItemKey={(playlist) => playlist.slug}
          coverflow
          allowDragFromSlides
          renderItem={(playlist) => (
            <PlaylistCard
              playlist={playlist}
              className="w-full"
              variant="featured"
              hideBookmark={hideBookmark}
            />
          )}
        />
      </div>

      {playlists.length > 1 ? (
        <div className="relative z-[1] mt-6 flex items-center justify-center gap-3 sm:mt-8">
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Navigasi ragam playlist"
          >
            {playlists.map((playlist, index) => (
              <button
                key={playlist.slug}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-current={index === activeIndex}
                aria-label={`Ke playlist ${index + 1}: ${playlist.title}`}
                onClick={() => scrollToIndex(index)}
                className="carousel-dot"
              />
            ))}
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {activeIndex + 1}/{playlists.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}
