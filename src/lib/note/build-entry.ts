import { inferJournalResult } from "@/lib/note/stats";
import type { CreateEntryInput, JournalEntry } from "@/lib/note/types";

export function buildJournalEntry(apexUserId: string, input: CreateEntryInput): JournalEntry {
  const now = new Date().toISOString();
  const isRefleksi = input.kind === "REFLEKSI";
  const symbol = isRefleksi
    ? (input.relatedCourseSlug?.trim() || input.symbol.trim() || "Refleksi").toUpperCase()
    : input.symbol.trim().toUpperCase();

  return {
    id: crypto.randomUUID(),
    apexUserId,
    kind: input.kind,
    mode: input.mode,
    symbol,
    side: isRefleksi ? "NOTE" : input.side.trim().toUpperCase() || "BUY",
    qty: input.qty ?? null,
    entryPrice: input.entryPrice ?? null,
    exitPrice: input.exitPrice ?? null,
    fees: input.fees ?? null,
    pnl: isRefleksi ? null : (input.pnl ?? null),
    result: isRefleksi ? null : inferJournalResult(input.pnl ?? null, input.result ?? null),
    emotion: input.emotion ?? null,
    note: input.note ?? null,
    ruleBroken: input.ruleBroken ?? null,
    lesson: input.lesson ?? null,
    clinicModuleId: input.clinicModuleId ?? null,
    protocol: input.protocol ?? null,
    accountLabel: input.accountLabel ?? null,
    relatedCourseSlug: input.relatedCourseSlug?.trim() || null,
    relatedLessonId: input.relatedLessonId?.trim() || null,
    openedAt: input.openedAt || now,
    createdAt: now,
  };
}
