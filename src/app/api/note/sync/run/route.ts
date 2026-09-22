import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { runSyncAccount } from "@/lib/note/sync/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

const runSchema = z.object({ id: z.string().trim().min(1).max(64) });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "broker_sync", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = runSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("id wajib.", 400), origin);
    const summary = await runSyncAccount(auth.session.userId, parsed.data.id);
    return applyNoteCors(jsonOk(summary), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
