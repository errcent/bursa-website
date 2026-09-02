import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { canUseMode, countReviewsInWeek, filterEntriesForTier } from "@/lib/note/entitlements";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import { getClinicModule } from "@/lib/note/taxonomy";
import type { CreateEntryInput, JournalKind, JournalMode, JournalResult } from "@/lib/note/types";

const createSchema = z.object({
  kind: z.enum(["TRADE", "INVEST"]),
  mode: z.enum(["cepat", "review", "klinik"]),
  symbol: z.string().trim().min(1).max(32),
  side: z.string().trim().min(1).max(16),
  qty: z.number().finite().optional().nullable(),
  entryPrice: z.number().finite().optional().nullable(),
  exitPrice: z.number().finite().optional().nullable(),
  fees: z.number().finite().optional().nullable(),
  pnl: z.number().finite().optional().nullable(),
  result: z.enum(["win", "loss", "be", "open"]).optional().nullable(),
  emotion: z.string().trim().max(40).optional().nullable(),
  note: z.string().trim().max(2000).optional().nullable(),
  ruleBroken: z.string().trim().max(400).optional().nullable(),
  lesson: z.string().trim().max(400).optional().nullable(),
  clinicModuleId: z.string().trim().max(64).optional().nullable(),
  protocol: z.string().trim().max(400).optional().nullable(),
  accountLabel: z.string().trim().max(40).optional().nullable(),
  openedAt: z.string().trim().max(40).optional().nullable(),
});

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  try {
    const repo = getNoteRepo();
    const entitlement = await repo.getEntitlement(auth.session.userId);
    const all = await repo.listEntries(auth.session.userId);
    const entries = filterEntriesForTier(all, entitlement.plus);
    return applyNoteCors(
      jsonOk({
        entries,
        plus: entitlement.plus,
        reviewCountThisWeek: countReviewsInWeek(all),
      }),
      origin
    );
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  try {
    const parsed = createSchema.parse(await request.json());
    const repo = getNoteRepo();
    const entitlement = await repo.getEntitlement(auth.session.userId);
    const existing = await repo.listEntries(auth.session.userId);
    const gate = canUseMode(parsed.mode as JournalMode, {
      plus: entitlement.plus,
      reviewCountThisWeek: countReviewsInWeek(existing),
      clinicModuleId: parsed.clinicModuleId,
    });
    if (!gate.ok) {
      return applyNoteCors(jsonError(gate.reason ?? "Terkunci.", 402), origin);
    }

    if (parsed.mode === "klinik" && parsed.clinicModuleId && !getClinicModule(parsed.clinicModuleId)) {
      return applyNoteCors(jsonError("Modul Klinik tidak dikenal.", 400), origin);
    }

    const input: CreateEntryInput = {
      ...parsed,
      kind: parsed.kind as JournalKind,
      mode: parsed.mode as JournalMode,
      result: parsed.result as JournalResult | null | undefined,
    };
    const entry = await repo.createEntry(auth.session.userId, input);
    return applyNoteCors(jsonOk({ entry }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
