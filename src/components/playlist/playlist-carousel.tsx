"use client";

import { DiscoverInfiniteCarousel } from "@/components/infinite-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import {
  DISCOVER_MOBILE_PEEK_RATIO,
  discoverStripGetScrollPerView,
} from "@/components/scroll-carousel";
import { useMobileLayout } from "@/hooks/use-mobile-layout";
import type { PlaylistSummary } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

const LANDING_MOBILE_GAP = 12;
const LANDING_DESKTOP_GAP = 14;

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

  if (playlists.length === 0 || !discoverMode) return null;

  return (
    <div className={cn("relative min-w-0", discoverMode && "discover-filmstrip-panel", className)}>
      <div className="discover-filmstrip-bleed relative z-[1] min-w-0">
        <DiscoverInfiniteCarousel
          items={playlists}
          ariaLabel="Jalur belajar di Bursa"
          getPerView={discoverStripGetScrollPerView}
          gap={isMobile ? LANDING_MOBILE_GAP : LANDING_DESKTOP_GAP}
          mobilePeekRatio={DISCOVER_MOBILE_PEEK_RATIO}
          autoPlayPaused={autoPlayPaused}
          getItemKey={(playlist) => playlist.slug}
          allowDragFromSlides
          renderItem={(playlist) => (
            <PlaylistCard
              playlist={playlist}
              className="w-full"
              variant="strip"
              hideBookmark={hideBookmark}
            />
          )}
        />
      </div>
    </div>
  );
}
