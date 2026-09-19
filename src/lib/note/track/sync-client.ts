"use client";

import {
  isDemoTrackStore,
  loadTrackStoreLocal,
  saveTrackStoreLocal,
  withTrackDemoFallback,
} from "@/lib/note/track/client-store";
import { mergeTrackLocalAndServer } from "@/lib/note/track/parse-store";
import type { TrackStore } from "@/lib/note/track/types";

export type TrackSyncResult = {
  store: TrackStore;
  demo: boolean;
  openAccess: boolean;
};

export async function loadTrackWithSync(): Promise<TrackSyncResult> {
  const local = loadTrackStoreLocal();
  try {
    const res = await fetch(`/api/note/track?_=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (res.status === 401) {
      const fallback = withTrackDemoFallback(local);
      if (fallback.demo) saveTrackStoreLocal(fallback.store);
      return { store: fallback.store, demo: fallback.demo, openAccess: false };
    }
    if (!res.ok) throw new Error("track_fetch_failed");
    const payload = (await res.json()) as {
      store: TrackStore;
      demo?: boolean;
      openAccess?: boolean;
    };
    let merged = mergeTrackLocalAndServer(local, payload.store ?? local);
    let demo = Boolean(payload.demo);
    if (merged.portfolios.length === 0) {
      const fallback = withTrackDemoFallback(merged);
      merged = fallback.store;
      demo = fallback.demo;
    }
    saveTrackStoreLocal(merged);
    if (local.portfolios.length > 0 && merged === local) {
      void pushTrackToServer(merged);
    }
    return {
      store: merged,
      demo: demo || isDemoTrackStore(merged),
      openAccess: Boolean(payload.openAccess),
    };
  } catch {
    const fallback = withTrackDemoFallback(local);
    if (fallback.demo) saveTrackStoreLocal(fallback.store);
    return { store: fallback.store, demo: fallback.demo, openAccess: true };
  }
}

export async function pushTrackToServer(store: TrackStore): Promise<void> {
  try {
    await fetch("/api/note/track", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });
  } catch {
    /* local-first: ignore network errors pre-launch */
  }
}
