"use client";

import Link from "next/link";
import { ListVideo } from "lucide-react";

import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { PlaylistThumbnail } from "@/components/playlist/playlist-thumbnail";
import type { PlaylistSummary } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} mnt`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} j ${mins} mnt` : `${hours} jam`;
}

function playlistMetaLabel(playlist: PlaylistSummary) {
  return `${playlist.itemCount} video · ${formatDuration(playlist.totalMinutes)}`;
}

function playlistSubtitle(playlist: PlaylistSummary) {
  if (playlist.mentorCount > 0) {
    return `${playlist.mentorCount} mentor`;
  }
  return "Kurasi Bursa";
}

export function PlaylistCard({
  playlist,
  className,
  variant = "default",
}: {
  playlist: PlaylistSummary;
  className?: string;
  /** "catalog" — title below thumbnail; meta pill stays bottom-right on thumbnail. */
  variant?: "default" | "catalog";
}) {
  const subtitle = playlistSubtitle(playlist);
  const isCatalog = variant === "catalog";

  return (
    <Link
      href={`/playlist/${playlist.slug}`}
      prefetch={false}
      className={cn(
        "@container group relative block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCatalog ? "overflow-visible" : "overflow-hidden",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full min-h-0 overflow-hidden rounded-xl bg-surface-2">
        <PlaylistThumbnail
          playlist={playlist}
          withScrim={!isCatalog}
          fillSlot
          className="absolute inset-0"
        />

        <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-full border border-accent/30 bg-accent/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent backdrop-blur-sm">
            <ListVideo className="size-3" />
            Playlist
          </span>
        </div>

        <div className="absolute bottom-2.5 left-2.5 z-20">
          <BookmarkToggleButton bookmarkRef={{ type: "playlist", slug: playlist.slug }} />
        </div>

        {!isCatalog ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1.5 p-2.5 pb-3">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-tight text-white @[280px]:text-[15px]">
                {playlist.title}
              </h3>
              {subtitle ? (
                <p className="mt-1 truncate text-[11px] font-light text-white/70">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm @[220px]:inline">
              {playlistMetaLabel(playlist)}
            </span>
          </div>
        ) : (
          <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm @[220px]:text-[11px]">
            {playlistMetaLabel(playlist)}
          </span>
        )}
      </div>

      {isCatalog ? (
        <div className="pt-2">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-foreground @[280px]:text-[15px]">
            {playlist.title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-light text-muted-foreground @[280px]:text-xs">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}
