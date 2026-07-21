"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  getBookmarkCount,
  getBookmarks,
  isBookmarked,
  resolveBookmarkScope,
  subscribeBookmarks,
  toggleBookmark,
} from "@/lib/bookmarks/storage";
import type { BookmarkRef } from "@/lib/bookmarks/types";

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
  const [entries, setEntries] = useState(() => getBookmarks(scope));

  const refresh = useCallback(() => {
    setEntries(getBookmarks(scope));
  }, [scope]);

  useEffect(() => {
    refresh();
    return subscribeBookmarks(refresh);
  }, [refresh]);

  return {
    scope,
    entries,
    count: entries.length,
    refresh,
  };
}

/** Toggle + read state for a single saved item (kelas, video, playlist, mentor). */
export function useBookmark(ref: BookmarkRef) {
  const scope = useBookmarkScope();
  const [saved, setSaved] = useState(() => isBookmarked(scope, ref));

  const refresh = useCallback(() => {
    setSaved(isBookmarked(scope, ref));
  }, [scope, ref]);

  useEffect(() => {
    refresh();
    return subscribeBookmarks(refresh);
  }, [refresh]);

  const toggle = useCallback(() => {
    const next = toggleBookmark(scope, ref);
    setSaved(next);
    return next;
  }, [scope, ref]);

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
