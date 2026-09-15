"use client";

import { useEffect, useState } from "react";

import type { DailyCloseSeries } from "@/lib/note/track/yahoo-history";
import { trackSymbolsNeedingYahoo } from "@/lib/note/track/yahoo-symbols";
import type { TrackTransaction } from "@/lib/note/track/types";

export function useTrackMarketCloses(
  txns: TrackTransaction[],
  from: string,
  to: string
): { series: DailyCloseSeries; loading: boolean; error: string | null } {
  const [series, setSeries] = useState<DailyCloseSeries>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const symbols = trackSymbolsNeedingYahoo([...new Set(txns.map((t) => t.symbol))]);
    if (!symbols.length || !from || !to) {
      setSeries({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const q = new URLSearchParams({
      from,
      to,
      symbols: symbols.join(","),
    });

    void fetch(`/api/note/track/market-history?${q.toString()}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<{ series?: DailyCloseSeries }>;
      })
      .then((payload) => {
        if (cancelled) return;
        setSeries(payload.series ?? {});
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("market");
        setSeries({});
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [txns, from, to]);

  return { series, loading, error };
}
