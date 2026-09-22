"use client";

import { useEffect } from "react";

import { usdIdrRateNeedsRefresh } from "@/lib/note/fx/usd-idr-spot";
import { loadNotePrefs, saveNotePrefs } from "@/lib/note/prefs";

/**
 * Always pull live USD/IDR into prefs automatically.
 * No manual override — the rate is always synced from Yahoo Finance.
 */
export function useUsdIdrRateSync() {
  useEffect(() => {
    const prefs = loadNotePrefs();
    if (!usdIdrRateNeedsRefresh(prefs.usdIdrRateFetchedAt, false)) return;

    void fetch("/api/note/fx/usd-idr", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { rate?: number; fetchedAt?: string } | null) => {
        if (body?.rate == null) return;
        const current = loadNotePrefs();
        saveNotePrefs({
          ...current,
          usdIdrRate: body.rate,
          usdIdrRateFetchedAt: body.fetchedAt ?? new Date().toISOString(),
          usdIdrRateManual: false,
        });
      })
      .catch(() => {});
  }, []);

  // Also refresh every 4 hours while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      void fetch("/api/note/fx/usd-idr", { credentials: "include", cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((body: { rate?: number; fetchedAt?: string } | null) => {
          if (body?.rate == null) return;
          const current = loadNotePrefs();
          saveNotePrefs({
            ...current,
            usdIdrRate: body.rate,
            usdIdrRateFetchedAt: body.fetchedAt ?? new Date().toISOString(),
            usdIdrRateManual: false,
          });
        })
        .catch(() => {});
    }, 4 * 60 * 60 * 1000); // 4 hours

    return () => clearInterval(interval);
  }, []);
}
