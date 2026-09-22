import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  kind: z.enum(["TRADE", "INVEST", "REFLEKSI"]).optional(),
  mode: z.enum(["cepat", "review", "klinik"]).optional(),
  symbol: z.string().trim().max(32).optional(),
  side: z.string().trim().max(16).optional(),
  qty: z.number().finite().optional().nullable(),
  entryPrice: z.number().finite().optional().nullable(),
  exitPrice: z.number().finite().optional().nullable(),
  fees: z.number().finite().optional().nullable(),
  pnl: z.number().finite().optional().nullable(),
  result: z.enum(["win", "loss", "be", "open"]).optional().nullable(),
  emotion: z.string().trim().max(40).optional().nullable(),
  note: z.string().trim().max(4000).optional().nullable(),
  ruleBroken: z.string().trim().max(400).optional().nullable(),
  lesson: z.string().trim().max(400).optional().nullable(),
  clinicModuleId: z.string().trim().max(64).optional().nullable(),
  protocol: z.string().trim().max(400).optional().nullable(),
  accountLabel: z.string().trim().max(40).optional().nullable(),
  stopLoss: z.number().finite().optional().nullable(),
  takeProfit: z.number().finite().optional().nullable(),
  thesis: z.string().trim().max(1000).optional().nullable(),
  relatedCourseSlug: z.string().trim().max(120).optional().nullable(),
  relatedLessonId: z.string().trim().max(64).optional().nullable(),
  openedAt: z.string().trim().max(40).optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const { id } = await ctx.params;
    const body = patchSchema.parse(await request.json());
    const repo = getNoteRepo();
    const entry = await repo.updateEntry(auth.session.userId, id, body);
    if (!entry) return applyNoteCors(jsonError("Not found", 404), origin);
    return applyNoteCors(jsonOk({ entry }), origin);
  } catch (err) {
    return applyNoteCors(handleApiError(err), origin);
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const { id } = await ctx.params;
    const ok = await getNoteRepo().deleteEntry(auth.session.userId, id);
    if (!ok) return applyNoteCors(jsonError("Not found", 404), origin);
    return applyNoteCors(jsonOk({ deleted: true }), origin);
  } catch (err) {
    return applyNoteCors(handleApiError(err), origin);
  }
}
