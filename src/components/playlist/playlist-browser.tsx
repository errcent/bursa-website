"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ListVideo } from "lucide-react";

import { PlaylistCard } from "@/components/playlist/playlist-card";
import type { PlaylistSummary } from "@/lib/playlist/types";

export function PlaylistBrowser() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/playlists", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { playlists?: PlaylistSummary[] };
      setPlaylists(data.playlists ?? []);
    } catch {
      setPlaylists([]);
      setError("Gagal memuat playlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-accent">Kurasi Bursa</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Playlists
        </h1>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Memuat playlist…</p>
      ) : playlists.length === 0 ? (
        <div className="surface-card flex flex-col items-center rounded-2xl border border-dashed border-border/80 px-6 py-14 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ListVideo className="size-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading text-lg font-medium">Belum ada playlist</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Playlist kurasi akan muncul di sini setelah ditambahkan oleh tim Bursa.
          </p>
          <Link href="/katalog" className="mt-6 text-sm text-accent underline-offset-2 hover:underline">
            Jelajahi katalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}
