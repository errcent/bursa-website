import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import {
  DEFAULT_JOURNAL_DEFAULTS,
  JOURNAL_DEFAULTS_BLOB,
  normalizeDefaults,
} from "@/lib/note/defaults";
import { getNoteRepo } from "@/lib/note/repo";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    const repo = getNoteRepo();
    const raw = await repo.getUserBlob(auth.session.userId, JOURNAL_DEFAULTS_BLOB);
    return applyNoteCors(jsonOk({ defaults: normalizeDefaults(raw) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

const saveSchema = z.object({
  breakevenBand: z.number().finite().min(0).max(1_000_000),
  defaultFee: z.number().finite().min(0).max(1_000_000),
  multipliers: z.record(z.string().trim().max(24), z.number().finite().min(0).max(1_000_000)),
  statementTz: z.string().trim().min(1).max(64),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("Payload tidak valid.", 400), origin);
    const repo = getNoteRepo();
    const defaults = normalizeDefaults(parsed.data);
    await repo.setUserBlob(auth.session.userId, JOURNAL_DEFAULTS_BLOB, defaults);
    return applyNoteCors(jsonOk({ defaults }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

export { DEFAULT_JOURNAL_DEFAULTS };
