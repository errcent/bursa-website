"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { WatchlistMiniSparkline } from "@/components/watchlist-mini-sparkline";
import { Button } from "@/components/ui/button";
import { getWatchlistDayMove } from "@/lib/watchlist-sparkline";
import { cn } from "@/lib/utils";

type WatchlistItem = {
  id: string;
  ticker: string;
  instrument: string;
  notes: string | null;
  createdAt: string;
};

export function DashboardWatchlist() {
  const { session } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [ticker, setTicker] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const loadItems = useCallback(async () => {
    if (!session?.userId && !session?.email) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/me/watchlist?${authQuery()}`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { items?: WatchlistItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setError("Gagal memuat watchlist.");
    } finally {
      setLoading(false);
    }
  }, [session?.userId, session?.email, authQuery, authHeaders]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      setError("Ticker wajib diisi.");
      return;
    }
    if (items.some((item) => item.ticker === symbol)) {
      setError(`${symbol} sudah ada di watchlist.`);
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/me/watchlist", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: session?.userId,
          email: session?.email,
          name: session?.name,
          role: session?.role,
          ticker: symbol,
          // API defaults instrument to SAHAM when omitted
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { item?: WatchlistItem; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah ticker.");
        return;
      }

      if (data.item) {
        setItems((prev) => [data.item!, ...prev]);
      }
      setTicker("");
      setNotes("");
      setShowForm(false);
    } catch {
      setError("Gagal menambah ticker.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/me/watchlist/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: session?.userId,
          email: session?.email,
          name: session?.name,
          role: session?.role,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menghapus item.");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Gagal menghapus item.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading flex items-center gap-2 text-sm font-medium">
          <Eye className="size-4 text-accent" />
          Watchlist
        </h3>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Tambah ticker"
          aria-expanded={showForm}
          onClick={() => {
            setShowForm((open) => !open);
            setError(null);
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 border-b border-border/60 pb-4">
          <input
            type="text"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Ticker (mis. BBCA)"
            maxLength={20}
            autoComplete="off"
            disabled={adding}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase disabled:opacity-60"
            aria-label="Ticker"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan (opsional)"
            maxLength={280}
            disabled={adding}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            aria-label="Catatan"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="btn-primary flex-1" disabled={adding}>
              {adding ? "Menambah…" : "Tambah"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={adding}
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Memuat watchlist…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft via-surface-2 to-background">
            <Eye className="size-4 text-accent" />
          </div>
          <p className="font-heading text-sm font-medium">Watchlist masih kosong</p>
          <p className="max-w-[220px] text-xs text-muted-foreground">
            Ketik ticker yang ingin kamu pantau, lalu tambahkan.
          </p>
          {!showForm ? (
            <Button size="sm" className="btn-primary mt-1" onClick={() => setShowForm(true)}>
              <Plus className="size-3.5" />
              Tambah
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const day = getWatchlistDayMove(item.ticker);
            const up = day.changePct >= 0;

            return (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono font-medium">{item.ticker}</p>
                  {item.notes ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.notes}</p>
                  ) : (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{day.priceLabel}</p>
                  )}
                </div>

                <WatchlistMiniSparkline
                  points={day.points}
                  positive={up}
                  label={`${item.ticker} pergerakan hari ini (ilustratif)`}
                />

                <div className="w-[4.25rem] shrink-0 text-right">
                  <p
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-xs tabular-nums",
                      up ? "text-profit" : "text-loss"
                    )}
                  >
                    {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {up && day.changePct > 0 ? "+" : ""}
                    {day.changePct.toFixed(2)}%
                  </p>
                </div>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Hapus ${item.ticker}`}
                  disabled={removingId === item.id}
                  onClick={() => void handleRemove(item.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Chart &amp; % hari ini ilustratif (bukan data pasar riil) — untuk belajar, bukan rekomendasi
        beli/jual.
      </p>
    </div>
  );
}
