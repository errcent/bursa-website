import { inferJournalResult } from "@/lib/note/stats";
import { plannedRR, actualRR } from "@/lib/note/r-multiple";
import type { CreateEntryInput, JournalEntry } from "@/lib/note/types";

export function buildJournalEntry(apexUserId: string, input: CreateEntryInput): JournalEntry {
  const now = new Date().toISOString();
  const isRefleksi = input.kind === "REFLEKSI";
  const symbol = isRefleksi
    ? (input.relatedCourseSlug?.trim() || input.symbol.trim() || "Refleksi").toUpperCase()
    : input.symbol.trim().toUpperCase();

  const stopLoss = input.stopLoss ?? null;
  const takeProfit = input.takeProfit ?? null;
  const entryPrice = input.entryPrice ?? null;
  const exitPrice = input.exitPrice ?? null;
  const side = isRefleksi ? "NOTE" : input.side.trim().toUpperCase() || "BUY";

  // Auto-compute R-multiple if SL + entry present
  const computedPlannedRR = plannedRR(entryPrice, stopLoss, takeProfit, side);
  const computedActualRR = actualRR(entryPrice, stopLoss, exitPrice, side);

  return {
    id: crypto.randomUUID(),
    apexUserId,
    kind: input.kind,
    mode: input.mode,
    symbol,
    side,
    qty: input.qty ?? null,
    entryPrice,
    exitPrice,
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
    stopLoss,
    takeProfit,
    plannedRR: computedPlannedRR,
    actualRR: computedActualRR,
    relatedCourseSlug: input.relatedCourseSlug?.trim() || null,
    relatedLessonId: input.relatedLessonId?.trim() || null,
    openedAt: input.openedAt || now,
    createdAt: now,
    properties: input.properties ?? null,
  };
}
