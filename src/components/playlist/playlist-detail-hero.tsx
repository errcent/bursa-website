"use client";

import Link from "next/link";
import { ArrowLeft, Clock, ListVideo, Play, UserRound } from "lucide-react";

import { PlaylistThumbnail } from "@/components/playlist/playlist-thumbnail";
import { formatPlaylistDuration } from "@/components/playlist/playlist-item-utils";
import { Button } from "@/components/ui/button";
import type { PlaylistDetail } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

type PlaylistDetailHeroProps = {
  playlist: PlaylistDetail;
  firstPlayableHref: string | null;
  accessSummary: { unlocked: number; locked: number } | null;
  onScrollToList?: () => void;
  /** Compact layout for the landing iPad device canvas. */
  variant?: "default" | "device";
};

export function PlaylistDetailHero({
  playlist,
  firstPlayableHref,
  accessSummary,
  onScrollToList,
  variant = "default",
}: PlaylistDetailHeroProps) {
  const ctaHref = firstPlayableHref ?? "#playlist-videos";
  const ctaLabel = firstPlayableHref ? "Mulai Playlist" : "Lihat Daftar Video";
  const isDevice = variant === "device";

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[1800px] overflow-hidden",
          isDevice
            ? "aspect-video max-h-none"
            : "max-sm:min-h-[34rem] max-sm:aspect-auto sm:aspect-video sm:max-h-[78vh]"
        )}
      >
        <PlaylistThumbnail
          playlist={playlist}
          fillSlot
          className="absolute inset-0"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent max-sm:via-black/35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.5)_42%,transparent_72%)]"
          aria-hidden
        />

        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col",
            isDevice ? "px-10 pb-9 pt-9" : "px-5 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14"
          )}
        >
          {!isDevice ? (
            <div className="min-h-[10rem] shrink-0 sm:min-h-[8rem] lg:min-h-[10rem]">
              <Link
                href="/katalog"
                className="link-muted inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-4" />
                Kembali ke katalog
              </Link>
            </div>
          ) : (
            <div className="shrink-0 grow" />
          )}

          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-widest text-accent">
                Playlist
              </p>

              <h1
                className={cn(
                  "mt-2 font-heading font-semibold leading-[1.02] tracking-[-0.04em] text-white",
                  isDevice
                    ? "text-[2.35rem]"
                    : "text-[clamp(2rem,5.5vw,3.75rem)]"
                )}
              >
                {playlist.title}
              </h1>

              {playlist.mentorCount > 0 ? (
                <p className="mt-3 text-sm font-normal tracking-wide text-white/45">
                  {playlist.mentorCount} mentor · kurasi Bursa
                </p>
              ) : null}

              {playlist.description ? (
                <p
                  className={cn(
                    "section-copy mt-4 max-w-xl leading-relaxed text-white/65",
                    isDevice ? "text-sm line-clamp-2" : "text-[0.9375rem] sm:text-base"
                  )}
                >
                  {playlist.description}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <ListVideo className="size-3.5" />
                  {playlist.itemCount} video
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatPlaylistDuration(playlist.totalMinutes)}
                </span>
                {playlist.mentorCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="size-3.5" />
                    {playlist.mentorCount} mentor
                  </span>
                ) : null}
                {accessSummary ? (
                  <span>
                    {accessSummary.unlocked} terbuka
                    {accessSummary.locked > 0 ? ` · ${accessSummary.locked} terkunci` : ""}
                  </span>
                ) : null}
              </div>

              <div className="mt-7">
                {firstPlayableHref ? (
                  <Button
                    size="lg"
                    className="h-12 gap-2.5 rounded-md bg-white px-7 text-sm font-semibold text-black shadow-lg shadow-black/25 hover:bg-white/92"
                    render={<Link href={ctaHref} />}
                    tabIndex={isDevice ? -1 : undefined}
                  >
                    <Play className="size-4 fill-current" />
                    {ctaLabel}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    type="button"
                    className="h-12 gap-2.5 rounded-md bg-white px-7 text-sm font-semibold text-black shadow-lg shadow-black/25 hover:bg-white/92"
                    onClick={onScrollToList}
                    tabIndex={isDevice ? -1 : undefined}
                  >
                    <Play className="size-4 fill-current" />
                    {ctaLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
