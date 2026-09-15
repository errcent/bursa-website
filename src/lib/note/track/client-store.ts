"use client";

import { buildDemoTrackStore } from "@/lib/note/track/demo-seed";
import { emptyTrackStore, parseTrackStore } from "@/lib/note/track/parse-store";
import type { Portfolio, TrackStore, TrackTransaction } from "@/lib/note/track/types";
import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";

export const TRACK_STORAGE_KEY = "bursa-note-track-v1";

export { emptyTrackStore, parseTrackStore };

export function loadTrackStoreLocal(): TrackStore {
  if (typeof window === "undefined") return emptyTrackStore();
  try {
    const raw = localStorage.getItem(TRACK_STORAGE_KEY);
    if (!raw) return emptyTrackStore();
    return parseTrackStore(JSON.parse(raw) as unknown);
  } catch {
    return emptyTrackStore();
  }
}

export function saveTrackStoreLocal(store: TrackStore) {
  localStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(store));
}

/** Seed demo portfolios when empty during open access preview. */
export function withTrackDemoFallback(store: TrackStore): { store: TrackStore; demo: boolean } {
  if (!isNoteOpenAccessPeriod()) return { store, demo: false };
  if (store.portfolios.length > 0) return { store, demo: false };
  const demo = buildDemoTrackStore();
  return { store: demo, demo: true };
}

export function newPortfolioId() {
  return `pf-${crypto.randomUUID()}`;
}

export function newTransactionId() {
  return `tx-${crypto.randomUUID()}`;
}

export function addPortfolio(store: TrackStore, name: string): TrackStore {
  const portfolio: Portfolio = {
    id: newPortfolioId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  return {
    ...store,
    portfolios: [...store.portfolios, portfolio],
  };
}

export function addTransaction(store: TrackStore, tx: TrackTransaction): TrackStore {
  return {
    ...store,
    transactions: [...store.transactions, tx],
  };
}

export function txnsForScope(store: TrackStore, scope: "all" | string): TrackTransaction[] {
  if (scope === "all") return store.transactions;
  return store.transactions.filter((t) => t.portfolioId === scope);
}
