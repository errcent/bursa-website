"use client";

import { useEffect } from "react";

import { usdIdrRateNeedsRefresh } from "@/lib/note/fx/usd-idr-spot";
import { loadNotePrefs, saveNotePrefs } from "@/lib/note/prefs";

/** Pull live USD/IDR into prefs unless the user set a manual override. */
export function useUsdIdrRateSync() {
  useEffect(() => {
    const prefs = loadNotePrefs();
    if (!usdIdrRateNeedsRefresh(prefs.usdIdrRateFetchedAt, prefs.usdIdrRateManual === true)) return;

    void fetch("/api/note/fx/usd-idr", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { rate?: number; fetchedAt?: string } | null) => {
        if (body?.rate == null) return;
        const current = loadNotePrefs();
        if (current.usdIdrRateManual) return;
        saveNotePrefs({
          ...current,
          usdIdrRate: body.rate,
          usdIdrRateFetchedAt: body.fetchedAt ?? new Date().toISOString(),
        });
      })
      .catch(() => {});
  }, []);
}
