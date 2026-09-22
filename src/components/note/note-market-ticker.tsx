"use client";

import { useEffect, useState } from "react";

import type { UnifiedQuote } from "@/lib/note/market/unified";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

const TICKER_SYMBOLS = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "USDIDR=X", label: "USD/IDR" },
  { symbol: "BBCA.JK", label: "BBCA" },
];

export function NoteMarketTicker() {
  const [prefs] = useNotePrefs();
  const [quotes, setQuotes] = useState<Record<string, UnifiedQuote | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const symbols = TICKER_SYMBOLS.map((t) => t.symbol);
    const q = new URLSearchParams({ symbols: symbols.join(",") });
    void fetch(`/api/note/market/quote?${q.toString()}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<Record<string, UnifiedQuote | null>>;
      })
      .then((payload) => {
        if (cancelled) return;
        setQuotes(payload ?? {});
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    const interval = setInterval(() => {
      void fetch(`/api/note/market/quote?${q.toString()}`, {
        credentials: "include",
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((p: Record<string, UnifiedQuote | null>) => {
          if (!cancelled) setQuotes(p ?? {});
        })
        .catch(() => {});
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading && Object.keys(quotes).length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-3 py-2 text-xs">
      {TICKER_SYMBOLS.map((t) => {
        const q = quotes[t.symbol];
        const price = q?.price;
        const chg = q?.changePct;
        return (
          <span key={t.symbol} className="inline-flex items-center gap-1.5">
            <span className="text-zinc-400">{t.label}</span>
            {price != null ? (
              <>
                <span className="tabular-nums font-medium text-zinc-200">
                  {price.toLocaleString(undefined, { maximumFractionDigits: price >= 1000 ? 0 : 4 })}
                </span>
                {chg != null && chg !== 0 ? (
                  <span className={cn("tabular-nums", chg >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-zinc-600">-</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
