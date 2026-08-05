"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  getBookmarkCount,
  getBookmarks,
  isBookmarked,
  mergeRemoteBookmarks,
  resolveBookmarkScope,
  subscribeBookmarks,
  toggleBookmark,
  toggleBookmarkRemote,
} from "@/lib/bookmarks/storage";
import type { BookmarkRef } from "@/lib/bookmarks/types";

const GUEST_SCOPE = "guest";

export function useBookmarkScope() {
  const { session } = useAuth();
  return useMemo(
    () => resolveBookmarkScope(session?.userId),
    [session?.userId]
  );
}

/** All bookmarks for the current guest/user scope. */
export function useBookmarks() {
  const scope = useBookmarkScope();
  const isRemote = scope !== GUEST_SCOPE;
  const [entries, setEntries] = useState(() => getBookmarks(scope));
  const [loading, setLoading] = useState(isRemote);

  const refresh = useCallback(async () => {
    if (isRemote) {
      setLoading(true);
      try {
        const remote = await mergeRemoteBookmarks(scope);
        setEntries(remote);
      } finally {
        setLoading(false);
      }
      return;
    }
    setEntries(getBookmarks(scope));
  }, [scope, isRemote]);

  useEffect(() => {
    void refresh();
    return subscribeBookmarks(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    scope,
    entries,
    count: entries.length,
    loading,
    refresh,
  };
}

/** Toggle + read state for a single saved item (kelas, video, playlist, mentor). */
export function useBookmark(ref: BookmarkRef) {
  const scope = useBookmarkScope();
  const isRemote = scope !== GUEST_SCOPE;
  const [saved, setSaved] = useState(() => isBookmarked(scope, ref));

  const refresh = useCallback(() => {
    setSaved(isBookmarked(scope, ref));
  }, [scope, ref]);

  useEffect(() => {
    refresh();
    return subscribeBookmarks(refresh);
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (isRemote) {
      const next = await toggleBookmarkRemote(scope, ref);
      setSaved(next);
      return next;
    }
    const next = toggleBookmark(scope, ref);
    setSaved(next);
    return next;
  }, [scope, ref, isRemote]);

  return { saved, toggle, scope };
}

export function useBookmarkCount() {
  const scope = useBookmarkScope();
  const [count, setCount] = useState(() => getBookmarkCount(scope));

  const refresh = useCallback(() => {
    setCount(getBookmarkCount(scope));
  }, [scope]);

  useEffect(() => {
    refresh();
    return subscribeBookmarks(refresh);
  }, [refresh]);

  return count;
}
