"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  ListVideo,
  PlayCircle,
  Trash2,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import type { PlaylistDetail, PlaylistItemView } from "@/lib/playlist/types";
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

export function PlaylistDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (session?.email) headers["x-user-email"] = session.email;
    return headers;
  }, [session?.email]);

  const authQuery = useCallback(() => {
    const params = new URLSearchParams({
      ...(session?.userId ? { userId: session.userId } : {}),
      ...(session?.email ? { email: session.email } : {}),
    });
    return params.toString();
  }, [session?.userId, session?.email]);

  const loadPlaylist = useCallback(async () => {
    if (!session?.userId && !session?.email) {
      setPlaylist(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/me/playlists/${encodeURIComponent(slug)}?${authQuery()}`, {
        cache: "no-store",
        headers: authHeaders(),
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
  }, [slug, session?.userId, session?.email, authQuery, authHeaders]);

  useEffect(() => {
    void loadPlaylist();
  }, [loadPlaylist]);

  async function handleDelete() {
    if (!playlist || !confirm(`Hapus playlist "${playlist.title}"?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/me/playlists/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: session?.userId,
          email: session?.email,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Gagal menghapus playlist.");
        return;
      }
      router.replace("/playlist");
    } catch {
      setError("Gagal menghapus playlist.");
    } finally {
      setDeleting(false);
    }
  }

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/playlist"
            className="link-muted mb-4 inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Semua playlist
          </Link>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Playlist</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {playlist.title}
          </h1>
          {playlist.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {playlist.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ListVideo className="size-3.5" />
              {playlist.itemCount} pelajaran
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
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-2 text-destructive hover:text-destructive"
          onClick={() => void handleDelete()}
          disabled={deleting}
        >
          <Trash2 className="size-4" />
          {deleting ? "Menghapus..." : "Hapus"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {playlist.items.length === 0 ? (
        <div className="surface-card rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Playlist ini masih kosong. Tambahkan pelajaran dari katalog untuk mulai menyusun alur
            belajar Anda.
          </p>
          <Button render={<Link href="/katalog" />} className="mt-4">
            Jelajahi Katalog
          </Button>
        </div>
      ) : (
        <ol className="space-y-3">
          {playlist.items.map((item, index) => (
            <li key={item.id}>
              <Link
                href={lessonHref(item)}
                className={cn(
                  "surface-card-hover group flex gap-4 rounded-xl border border-border/80 p-4 sm:items-center"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-sm font-medium text-accent">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-medium leading-snug group-hover:text-accent">
                    {item.lessonTitle ?? item.courseTitle ?? "Pelajaran"}
                  </p>
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
                  <PlayCircle className="size-5 text-foreground/30 transition-colors group-hover:text-accent" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
