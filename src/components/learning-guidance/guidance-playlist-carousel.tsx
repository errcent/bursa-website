"use client";

import type { ReactNode } from "react";

import { GuidancePickCarousel } from "@/components/learning-guidance/guidance-pick-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import type { ScoredPlaylist } from "@/lib/learning/guidance/types";

export function GuidancePlaylistCarousel({
  playlists,
  sectionLink,
}: {
  playlists: ScoredPlaylist[];
  sectionLink?: ReactNode;
}) {
  return (
    <GuidancePickCarousel
      items={playlists}
      ariaLabel="Playlist rekomendasi"
      sectionTitle="Playlist"
      sectionLink={sectionLink}
      getItemKey={(entry) => entry.playlist.id}
      getReason={(entry) => entry.reasons[0]}
      renderCard={(entry) => (
        <PlaylistCard
          playlist={entry.playlist}
          variant="featured"
          hideBookmark
          className="w-full"
        />
      )}
    />
  );
}
