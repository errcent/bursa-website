"use client";

import Link from "next/link";
import { Clock, ListVideo, PlayCircle, Users } from "lucide-react";

import type { PlaylistSummary } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

const ACCENT_GRADIENTS = [
  "from-violet-500/25 via-fuchsia-500/10 to-background",
  "from-sky-500/25 via-indigo-500/10 to-background",
  "from-emerald-500/20 via-teal-500/10 to-background",
  "from-amber-500/20 via-orange-500/10 to-background",
  "from-rose-500/20 via-pink-500/10 to-background",
] as const;

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} mnt`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} j ${mins} mnt` : `${hours} jam`;
}

function gradientForSlug(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % ACCENT_GRADIENTS.length;
  }
  return ACCENT_GRADIENTS[hash] ?? ACCENT_GRADIENTS[0];
}

export function PlaylistCard({
  playlist,
  className,
}: {
  playlist: PlaylistSummary;
  className?: string;
}) {
  const gradient = gradientForSlug(playlist.slug);

  return (
    <Link
      href={`/playlist/${playlist.slug}`}
      className={cn(
        "surface-card-hover group flex h-full w-full flex-col overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br",
          gradient
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,var(--glow),transparent_55%)] opacity-60" />
        <ListVideo
          className="size-10 text-foreground/15 transition-transform duration-300 ease-out group-hover:scale-105"
          strokeWidth={1.25}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
          <PlayCircle className="size-9 text-foreground/90" />
        </div>
        <div className="absolute left-3 top-3">
          <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-medium tracking-wide text-foreground/80 backdrop-blur-sm">
            {playlist.itemCount} pelajaran
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-heading text-sm font-medium leading-snug">
          {playlist.title}
        </h3>
        {playlist.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{playlist.description}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatDuration(playlist.totalMinutes)}
          </span>
          {playlist.mentorCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {playlist.mentorCount} mentor
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
