import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { withDemoJournalFallback } from "@/lib/note/demo-entries";
import { canUseMode, countReviewsInWeek, filterEntriesForTier } from "@/lib/note/entitlements";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, attachNoteSessionCookies, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { parseJournalListQuery } from "@/lib/note/journal-list-query";
import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";
import { getNoteRepo } from "@/lib/note/repo";
import { getClinicModule } from "@/lib/note/taxonomy";
import type { CreateEntryInput, JournalKind, JournalMode, JournalResult } from "@/lib/note/types";

export const dynamic = "force-dynamic";

const createSchema = z
  .object({
    kind: z.enum(["TRADE", "INVEST", "REFLEKSI"]),
    mode: z.enum(["cepat", "review", "klinik"]),
    symbol: z.string().trim().max(32).optional().default(""),
    side: z.string().trim().max(16).optional().default("BUY"),
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
    relatedCourseSlug: z.string().trim().max(120).optional().nullable(),
    relatedLessonId: z.string().trim().max(64).optional().nullable(),
    openedAt: z.string().trim().max(40).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "REFLEKSI") {
      if (!data.note?.trim()) {
        ctx.addIssue({ code: "custom", message: "Catatan wajib untuk refleksi.", path: ["note"] });
      }
      return;
    }
    if (!data.symbol?.trim()) {
      ctx.addIssue({ code: "custom", message: "Simbol wajib.", path: ["symbol"] });
    }
  });

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_read", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const { limit, cursor } = parseJournalListQuery(request.nextUrl.searchParams);
    const repo = getNoteRepo();
    const entitlement = await repo.getEntitlement(auth.session.userId);
    const page = await repo.listEntriesPage(auth.session.userId, { limit, cursor });
    const { entries: source, demo: useDemoFallback } = withDemoJournalFallback(page.entries);
    const entries = filterEntriesForTier(source, entitlement.plus);
    const res = jsonOk({
      entries,
      nextCursor: page.nextCursor,
      plus: entitlement.plus,
      reviewCountThisWeek: countReviewsInWeek(entries),
      demo: useDemoFallback,
      openAccess: isNoteOpenAccessPeriod(),
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    return applyNoteCors(attachNoteSessionCookies(request, res, auth.session), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

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
      symbol: parsed.symbol ?? "",
      side: parsed.side ?? "BUY",
      kind: parsed.kind as JournalKind,
      mode: parsed.mode as JournalMode,
      result: parsed.result as JournalResult | null | undefined,
    };
    const entry = await repo.createEntry(auth.session.userId, input);
    return applyNoteCors(attachNoteSessionCookies(request, jsonOk({ entry }), auth.session), origin);
  } catch (error) {
    if (error instanceof Error && error.message === "NOTE_JOURNAL_CAP") {
      return applyNoteCors(jsonError("Batas entry jurnal tercapai.", 413), origin);
    }
    return applyNoteCors(handleApiError(error), origin);
  }
}
