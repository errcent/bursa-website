"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListVideo,
  Lock,
  PlayCircle,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { PlaylistThumbnail } from "@/components/playlist/playlist-thumbnail";
import { Button } from "@/components/ui/button";
import { buildLoginHref } from "@/lib/auth/redirect";
import type { PlaylistDetail, PlaylistItemAccessStatus, PlaylistItemView } from "@/lib/playlist/types";
import { cn } from "@/lib/utils";

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} j ${mins} mnt` : `${hours} jam`;
}

function lessonHref(item: PlaylistItemView) {
  if (!item.courseSlug) return "/katalog";
  if (item.lessonLegacyId) return `/belajar/${item.courseSlug}/${item.lessonLegacyId}`;
  return `/kelas/${item.courseSlug}`;
}

function isItemPlayable(status: PlaylistItemAccessStatus | undefined) {
  return status === "owned" || status === "free";
}

function itemHref(
  item: PlaylistItemView,
  status: PlaylistItemAccessStatus | undefined,
  isLoggedIn: boolean
) {
  if (isItemPlayable(status)) return lessonHref(item);
  const checkoutHref = item.courseSlug ? `/checkout/${item.courseSlug}` : "/katalog";
  return isLoggedIn ? checkoutHref : buildLoginHref(checkoutHref);
}

function AccessBadge({ status }: { status: PlaylistItemAccessStatus | undefined }) {
  if (status === "owned") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald/25 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
        <CheckCircle2 className="size-3" />
        Dimiliki
      </span>
    );
  }
  if (status === "free") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald/25 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald">
        <Sparkles className="size-3" />
        Gratis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Lock className="size-3" />
      Terkunci
    </span>
  );
}

export function PlaylistDetailView({ slug }: { slug: string }) {
  const { session, isLoading: authLoading } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        credentials: "include",
        headers: session?.email ? { "x-user-email": session.email } : {},
      });
      if (res.status === 404) {
        setPlaylist(null);
        setError("Playlist tidak ditemukan.");
        return;
      }
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { playlist?: PlaylistDetail };
      setPlaylist(data.playlist ?? null);
    } catch {
      setPlaylist(null);
      setError("Gagal memuat playlist.");
    } finally {
      setLoading(false);
    }
  }, [session?.email, slug]);

  useEffect(() => {
    if (authLoading) return;
    void loadPlaylist();
  }, [authLoading, loadPlaylist]);

  const accessSummary = useMemo(() => {
    if (!playlist?.items.length) return null;
    const owned = playlist.items.filter((item) => item.accessStatus === "owned").length;
    const free = playlist.items.filter((item) => item.accessStatus === "free").length;
    const unlocked = owned + free;
    const locked = playlist.items.length - unlocked;
    return { owned, free, unlocked, locked };
  }, [playlist?.items]);

  if (loading) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Memuat playlist…</p>;
  }

  if (!playlist) {
    return (
      <div className="surface-card rounded-2xl border border-dashed border-border/80 px-6 py-14 text-center">
        <ListVideo className="mx-auto mb-4 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{error ?? "Playlist tidak ditemukan."}</p>
        <Button render={<Link href="/playlist" />} variant="outline" className="mt-6">
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/60">
        <PlaylistThumbnail playlist={playlist} fillSlot className="absolute inset-0 rounded-2xl" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <Link
            href="/playlist"
            className="link-muted mb-3 inline-flex items-center gap-1.5 text-sm text-white/80"
          >
            <ArrowLeft className="size-4" />
            Semua playlist
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Playlist</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {playlist.title}
          </h1>
          {playlist.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
              {playlist.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <ListVideo className="size-3.5" />
              {playlist.itemCount} video
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatDuration(playlist.totalMinutes)}
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
        </div>
      </div>

      {playlist.items.length === 0 ? (
        <div className="surface-card rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Playlist ini masih kosong.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {playlist.items.map((item, index) => {
            const status = item.accessStatus;
            const playable = isItemPlayable(status);
            const href = itemHref(item, status, Boolean(session));

            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={cn(
                    "surface-card-hover group flex gap-4 rounded-xl border border-border/80 p-4 sm:items-center",
                    !playable && "opacity-90"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-medium",
                      playable
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {playable ? index + 1 : <Lock className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "font-heading text-sm font-medium leading-snug",
                          playable ? "group-hover:text-accent" : "text-foreground"
                        )}
                      >
                        {item.lessonTitle ?? item.courseTitle ?? "Video"}
                      </p>
                      <AccessBadge status={status} />
                    </div>
                    {item.courseTitle ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        dari {item.courseTitle}
                      </p>
                    ) : null}
                    {item.mentorName ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <UserRound className="size-3" />
                        {item.mentorName}
                      </p>
                    ) : null}
                  </div>
                  <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(item.durationMinutes)}
                    </span>
                    {playable ? (
                      <PlayCircle className="size-5 text-foreground/30 transition-colors group-hover:text-accent" />
                    ) : (
                      <Lock className="size-5 text-muted-foreground/50" />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
