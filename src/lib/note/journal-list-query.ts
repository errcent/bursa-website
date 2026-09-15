import { NOTE_JOURNAL_LIST_MAX, NOTE_JOURNAL_PAGE_DEFAULT } from "@/lib/note/resource-limits";

export function parseJournalListQuery(searchParams: URLSearchParams): {
  limit: number;
  cursor: string | null;
} {
  const rawLimit = searchParams.get("limit");
  let limit = NOTE_JOURNAL_PAGE_DEFAULT;
  if (rawLimit != null && rawLimit.trim() !== "") {
    const n = Number(rawLimit);
    if (Number.isFinite(n) && n > 0) limit = Math.floor(n);
  }
  limit = Math.min(limit, NOTE_JOURNAL_LIST_MAX);
  const cursor = searchParams.get("cursor")?.trim() || null;
  return { limit, cursor };
}
