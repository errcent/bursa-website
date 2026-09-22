"use client";

import { useEffect, useState } from "react";

import type { UnifiedQuote } from "@/lib/note/market/unified";

export function useLiveQuotes(symbols: string[]): {
  quotes: Record<string, UnifiedQuote | null>;
  loading: boolean;
} {
  const [quotes, setQuotes] = useState<Record<string, UnifiedQuote | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbols.length) {
      setQuotes({});
      return;
    }

    let cancelled = false;
    setLoading(true);

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
        setQuotes({});
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Refresh every 60s
  }, [symbols.join(",")]);

  return { quotes, loading };
}
