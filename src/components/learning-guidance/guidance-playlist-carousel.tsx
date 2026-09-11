"use client";

import { GuidancePickCarousel } from "@/components/learning-guidance/guidance-pick-carousel";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import type { ScoredPlaylist } from "@/lib/learning/guidance/types";

export function GuidancePlaylistCarousel({ playlists }: { playlists: ScoredPlaylist[] }) {
  return (
    <GuidancePickCarousel
      items={playlists}
      ariaLabel="Playlist rekomendasi"
      getItemKey={(entry) => entry.playlist.id}
      getReason={(entry) => entry.reasons[0]}
      renderCard={(entry) => (
        <PlaylistCard
          playlist={entry.playlist}
          variant="guidance"
          hideBookmark
          className="w-full"
        />
      )}
    />
  );
}
