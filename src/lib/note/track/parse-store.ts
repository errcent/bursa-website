import type { TrackStore } from "@/lib/note/track/types";

export function emptyTrackStore(): TrackStore {
  return { version: 1, portfolios: [], transactions: [] };
}

export function parseTrackStore(raw: unknown): TrackStore {
  if (!raw || typeof raw !== "object") return emptyTrackStore();
  const o = raw as Partial<TrackStore>;
  if (o.version !== 1) return emptyTrackStore();
  return {
    version: 1,
    portfolios: Array.isArray(o.portfolios) ? o.portfolios : [],
    transactions: Array.isArray(o.transactions) ? o.transactions : [],
  };
}

/** Prefer the store that has user-authored data (local-first until login launch). */
export function mergeTrackLocalAndServer(local: TrackStore, server: TrackStore): TrackStore {
  if (local.portfolios.length === 0 && server.portfolios.length > 0) return server;
  if (local.portfolios.length > 0) return local;
  return local;
}
