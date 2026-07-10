"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { WatchlistMiniSparkline } from "@/components/watchlist-mini-sparkline";
import { Button } from "@/components/ui/button";
import { ensurePrismaUser } from "@/lib/auth/client";
import { getWatchlistDayMove } from "@/lib/watchlist-sparkline";
import { cn } from "@/lib/utils";

const TICKER_PATTERN = /^[A-Za-z0-9.\-/=]+$/;

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
      await ensurePrismaUser(session);
      const res = await fetch(`/api/me/watchlist?${authQuery()}`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = (await res.json()) as { items?: WatchlistItem[]; error?: string };
      if (!res.ok) {
        setItems([]);
        setError(data.error ?? "Gagal memuat watchlist.");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      setError("Gagal memuat watchlist.");
    } finally {
      setLoading(false);
    }
  }, [session, authQuery, authHeaders]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!session?.userId && !session?.email) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await ensurePrismaUser(session);
        const res = await fetch(`/api/me/watchlist?${authQuery()}`, {
          cache: "no-store",
          headers: authHeaders(),
        });
        const data = (await res.json()) as { items?: WatchlistItem[]; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setItems([]);
          setError(data.error ?? "Gagal memuat watchlist.");
          return;
        }
        setItems(data.items ?? []);
      } catch {
        if (!cancelled) {
          setItems([]);
          setError("Gagal memuat watchlist.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, authQuery, authHeaders]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      setError("Ticker wajib diisi.");
      return;
    }
    if (!TICKER_PATTERN.test(symbol)) {
      setError("Ticker hanya boleh huruf, angka, dan . - / =");
      return;
    }
    if (items.some((item) => item.ticker.toUpperCase() === symbol)) {
      setError(`${symbol} sudah ada di watchlist.`);
      return;
    }

    setAdding(true);
    setError(null);

    try {
      if (session) await ensurePrismaUser(session);
      const res = await fetch("/api/me/watchlist", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: session?.userId,
          email: session?.email,
          name: session?.name,
          role: session?.role,
          ticker: symbol,
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { item?: WatchlistItem; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah ticker.");
        if (res.status === 409) {
          await loadItems();
        }
        return;
      }

      setTicker("");
      setNotes("");
      setShowForm(false);
      await loadItems();
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
      const res = await fetch(`/api/me/watchlist/${id}?${authQuery()}`, {
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
    <div className="surface-card min-w-0 overflow-hidden p-5">
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
      ) : error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="max-w-[240px] text-sm text-muted-foreground">
            Watchlist tidak dapat dimuat. Periksa koneksi lalu coba lagi.
          </p>
          <Button size="sm" variant="outline" onClick={() => void loadItems()}>
            Coba lagi
          </Button>
        </div>
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
            const up = day.changePct > 0;
            const flat = day.changePct === 0;

            return (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:grid-rows-1"
              >
                <div className="col-start-1 row-start-1 min-w-0">
                  <p className="truncate font-mono font-medium">{item.ticker}</p>
                  {item.notes ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.notes}</p>
                  ) : (
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {day.priceLabel}
                    </p>
                  )}
                </div>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Hapus ${item.ticker}`}
                  disabled={removingId === item.id}
                  onClick={() => void handleRemove(item.id)}
                  className="col-start-2 row-start-1 shrink-0 text-muted-foreground hover:text-destructive sm:col-start-4"
                >
                  <Trash2 className="size-3.5" />
                </Button>

                <WatchlistMiniSparkline
                  points={day.points}
                  positive={up || flat}
                  label={`${item.ticker} pergerakan hari ini (ilustratif)`}
                  className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
                />

                <div className="col-start-2 row-start-2 w-14 shrink-0 text-right sm:col-start-3 sm:row-start-1 sm:w-[4.25rem]">
                  <p
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-xs tabular-nums",
                      flat ? "text-muted-foreground" : up ? "text-profit" : "text-loss"
                    )}
                  >
                    {!flat ? (
                      up ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )
                    ) : null}
                    {up && day.changePct > 0 ? "+" : ""}
                    {day.changePct.toFixed(2)}%
                  </p>
                </div>
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
