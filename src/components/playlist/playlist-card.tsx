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
  hideBookmark = false,
}: {
  playlist: PlaylistSummary;
  className?: string;
  /** "featured", cinematic overlay; "catalog", title below; "strip", flat filmstrip tile. */
  variant?: "default" | "catalog" | "featured" | "strip";
  /** Hide bookmark toggle (e.g. landing page). */
  hideBookmark?: boolean;
}) {
  const isCatalog = variant === "catalog";
  const isFeatured = variant === "featured";
  const isStrip = variant === "strip";
  const subtitle = isFeatured || isStrip ? null : playlistSubtitle(playlist);

  return (
    <Link
      href={`/playlist/${playlist.slug}`}
      prefetch={false}
      className={cn(
        "@container group relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCatalog ? "overflow-visible" : "overflow-hidden",
        isStrip
          ? "rounded-none"
          : isFeatured
            ? "rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl"
            : "rounded-xl",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-video w-full min-h-0 overflow-hidden bg-surface-2",
          isStrip ? "rounded-none" : isFeatured ? "rounded-2xl" : "rounded-xl"
        )}
      >
        <PlaylistThumbnail
          playlist={playlist}
          withScrim={!isCatalog}
          fillSlot
          className="absolute inset-0"
        />

        {!isStrip ? (
          <div className="pointer-events-none absolute right-2.5 top-2.5 z-10">
            <ListVideo
              className={cn(
                "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]",
                isFeatured ? "size-5" : "size-4"
              )}
              aria-hidden
            />
            <span className="sr-only">Playlist</span>
          </div>
        ) : null}

        {!hideBookmark ? (
          <div className="absolute bottom-2.5 left-2.5 z-20">
            <BookmarkToggleButton bookmarkRef={{ type: "playlist", slug: playlist.slug }} />
          </div>
        ) : null}

        {!isCatalog ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1.5 p-2.5 pb-3">
            <div className="min-w-0 flex-1">
              <h3
                className={cn(
                  "line-clamp-2 font-heading font-semibold leading-tight text-white",
                  isFeatured
                    ? "text-base @[280px]:text-lg"
                    : "text-sm @[280px]:text-[15px]"
                )}
              >
                {playlist.title}
              </h3>
              {subtitle ? (
                <p className="mt-1 truncate text-[11px] font-light text-white/70">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {!isStrip ? (
              <span
                className={cn(
                  "hidden shrink-0 whitespace-nowrap rounded-full bg-black/45 px-2 py-1 font-medium text-white/85 backdrop-blur-sm @[220px]:inline",
                  isFeatured ? "text-[11px]" : "text-[10px]"
                )}
              >
                {playlistMetaLabel(playlist)}
              </span>
            ) : null}
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
