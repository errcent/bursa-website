import {
  bookmarkId,
  isBookmarkEntry,
  parseBookmarkId,
  type BookmarkEntry,
  type BookmarkRef,
} from "@/lib/bookmarks/types";

const STORAGE_PREFIX = "bursa-bookmarks";
const GUEST_SCOPE = "guest";
const CHANGE_EVENT = "bursa-bookmarks-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function storageKey(scope: string) {
  return `${STORAGE_PREFIX}:${scope}`;
}

function notifyChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeBookmarks(onChange: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => onChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function readRaw(scope: string): BookmarkEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BookmarkEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookmarkEntry);
  } catch {
    return [];
  }
}

function writeRaw(scope: string, entries: BookmarkEntry[]) {
  if (!isBrowser()) return;
  localStorage.setItem(storageKey(scope), JSON.stringify(entries));
  notifyChange();
}

/** Guest scope when logged out; per-user when `userId` is present. */
export function resolveBookmarkScope(userId?: string | null): string {
  return userId?.trim() ? userId.trim() : GUEST_SCOPE;
}

function migrateGuestBookmarks(userId: string) {
  if (!isBrowser()) return;
  const guestKey = storageKey(GUEST_SCOPE);
  const guestRaw = localStorage.getItem(guestKey);
  if (!guestRaw) return;

  const guestEntries = readRaw(GUEST_SCOPE);
  if (!guestEntries.length) {
    localStorage.removeItem(guestKey);
    return;
  }

  const userEntries = readRaw(userId);
  const byId = new Map<string, BookmarkEntry>();
  for (const entry of userEntries) byId.set(bookmarkId(entry), entry);
  for (const entry of guestEntries) {
    const id = bookmarkId(entry);
    if (!byId.has(id)) byId.set(id, entry);
  }

  writeRaw(userId, Array.from(byId.values()));
  localStorage.removeItem(guestKey);
}

export function getBookmarks(scope: string): BookmarkEntry[] {
  if (scope !== GUEST_SCOPE) migrateGuestBookmarks(scope);
  return readRaw(scope);
}

export function isBookmarked(scope: string, ref: BookmarkRef): boolean {
  const id = bookmarkId(ref);
  return getBookmarks(scope).some((entry) => bookmarkId(entry) === id);
}

export function toggleBookmark(scope: string, ref: BookmarkRef): boolean {
  const id = bookmarkId(ref);
  const entries = getBookmarks(scope);
  const exists = entries.some((entry) => bookmarkId(entry) === id);

  if (exists) {
    writeRaw(
      scope,
      entries.filter((entry) => bookmarkId(entry) !== id)
    );
    return false;
  }

  writeRaw(scope, [
    ...entries,
    { ...ref, savedAt: new Date().toISOString() },
  ]);
  return true;
}

export async function fetchRemoteBookmarks(): Promise<BookmarkEntry[]> {
  const res = await fetch("/api/me/bookmarks", { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: BookmarkEntry[] };
  return (data.items ?? []).filter(isBookmarkEntry);
}

/** Merge server bookmarks into local cache for logged-in users. */
export async function mergeRemoteBookmarks(scope: string): Promise<BookmarkEntry[]> {
  const remote = await fetchRemoteBookmarks();
  const local = getBookmarks(scope);
  const byId = new Map<string, BookmarkEntry>();
  for (const entry of remote) byId.set(bookmarkId(entry), entry);
  for (const entry of local) {
    const id = bookmarkId(entry);
    if (!byId.has(id)) byId.set(id, entry);
  }
  const merged = Array.from(byId.values());
  writeRaw(scope, merged);

  for (const entry of local) {
    if (!remote.some((r) => bookmarkId(r) === bookmarkId(entry))) {
      await fetch("/api/me/bookmarks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    }
  }

  return merged;
}

export async function toggleBookmarkRemote(
  scope: string,
  ref: BookmarkRef
): Promise<boolean> {
  const res = await fetch("/api/me/bookmarks", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ref),
  });
  if (!res.ok) {
    return toggleBookmark(scope, ref);
  }
  const data = (await res.json()) as { saved?: boolean };
  const saved = Boolean(data.saved);
  const id = bookmarkId(ref);
  const entries = getBookmarks(scope);
  if (saved) {
    if (!entries.some((e) => bookmarkId(e) === id)) {
      writeRaw(scope, [...entries, { ...ref, savedAt: new Date().toISOString() }]);
    }
  } else {
    writeRaw(
      scope,
      entries.filter((e) => bookmarkId(e) !== id)
    );
  }
  return saved;
}

export function getBookmarkCount(scope: string): number {
  return getBookmarks(scope).length;
}

export function getBookmarksByType(
  scope: string,
  type: BookmarkRef["type"]
): BookmarkEntry[] {
  return getBookmarks(scope).filter((entry) => entry.type === type);
}

export { parseBookmarkId, bookmarkId };
