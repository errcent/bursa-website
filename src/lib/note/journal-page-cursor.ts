/** Stable journal list cursor: ISO createdAt + entry id (desc sort tie-break). */
const CURSOR_SEP = "|";

export type JournalPageCursor = { createdAt: string; id: string | null };

export function encodeJournalPageCursor(entry: { createdAt: string; id: string }): string {
  return `${entry.createdAt}${CURSOR_SEP}${entry.id}`;
}

export function parseJournalPageCursor(raw: string): JournalPageCursor {
  const idx = raw.lastIndexOf(CURSOR_SEP);
  if (idx === -1) return { createdAt: raw, id: null };
  return { createdAt: raw.slice(0, idx), id: raw.slice(idx + 1) || null };
}

export function compareJournalEntriesDesc(
  a: { createdAt: string; id: string },
  b: { createdAt: string; id: string }
): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

/** True if `entry` follows `cursor` in createdAt desc, id desc order (next page). */
export function journalEntryAfterPageCursor(
  entry: { createdAt: string; id: string },
  cursor: JournalPageCursor
): boolean {
  if (entry.createdAt !== cursor.createdAt) return entry.createdAt < cursor.createdAt;
  if (!cursor.id) return false;
  return entry.id < cursor.id;
}
