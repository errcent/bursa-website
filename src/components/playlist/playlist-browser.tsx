"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ListPlus, ListVideo, Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { PlaylistCard } from "@/components/playlist/playlist-card";
import { Button } from "@/components/ui/button";
import type { PlaylistSummary } from "@/lib/playlist/types";

export function PlaylistBrowser() {
  const { session } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  const loadPlaylists = useCallback(async () => {
    if (!session?.userId && !session?.email) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/me/playlists?${authQuery()}`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { playlists?: PlaylistSummary[] };
      setPlaylists(data.playlists ?? []);
    } catch {
      setPlaylists([]);
      setError("Gagal memuat playlist.");
    } finally {
      setLoading(false);
    }
  }, [session?.userId, session?.email, authQuery, authHeaders]);

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Judul playlist wajib diisi.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/me/playlists", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: session?.userId,
          email: session?.email,
          title: trimmedTitle,
          description: description.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string; playlist?: PlaylistSummary };
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat playlist.");
        return;
      }

      setTitle("");
      setDescription("");
      setShowForm(false);
      await loadPlaylists();
    } catch {
      setError("Gagal membuat playlist.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Koleksi Anda</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Playlist Belajar
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Susun pelajaran dari berbagai mentor dan kelas menjadi satu alur belajar — seperti
            kurasi MasterClass untuk trading Anda.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="shrink-0 gap-2"
        >
          <ListPlus className="size-4" />
          Buat Playlist
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="surface-card space-y-4 rounded-xl border border-border/80 p-4 sm:p-5"
        >
          <div>
            <label htmlFor="playlist-title" className="mb-1.5 block text-sm font-medium">
              Judul playlist
            </label>
            <input
              id="playlist-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kesehatan Mental Trading"
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="playlist-description" className="mb-1.5 block text-sm font-medium">
              Deskripsi <span className="text-muted-foreground">(opsional)</span>
            </label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tulis tujuan atau tema playlist ini..."
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
              maxLength={500}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Menyimpan..." : "Simpan Playlist"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}

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
            Gabungkan modul psikologi trading, manajemen risiko, dan teknikal dari mentor berbeda
            dalam satu jalur belajar yang Anda susun sendiri.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1">
              <Sparkles className="size-3.5 text-accent" />
              Contoh: &ldquo;Kesehatan Mental Trading&rdquo;
            </span>
          </div>
          <Button type="button" className="mt-6 gap-2" onClick={() => setShowForm(true)}>
            <ListPlus className="size-4" />
            Buat Playlist Pertama
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Atau jelajahi{" "}
            <Link href="/katalog" className="text-accent underline-offset-2 hover:underline">
              katalog kelas
            </Link>{" "}
            untuk menemukan pelajaran yang ingin dikurasi.
          </p>
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
