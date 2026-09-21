import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import type { JournalDbSchema } from "@/lib/note/journal-db/types";

export const dynamic = "force-dynamic";

const schemaBody = z.object({
  version: z.literal(1),
  properties: z.array(z.record(z.string(), z.unknown())),
  views: z.array(z.record(z.string(), z.unknown())),
  defaultViewId: z.string(),
  updatedAt: z.string(),
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
    const schema = await getNoteRepo().getJournalSchema(auth.session.userId);
    return applyNoteCors(jsonOk({ schema }), origin);
  } catch (err) {
    return applyNoteCors(handleApiError(err), origin);
  }
}

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = schemaBody.parse(await request.json()) as unknown as JournalDbSchema;
    if (!body.properties?.length) {
      return applyNoteCors(jsonError("Schema properties required", 400), origin);
    }
    const schema = await getNoteRepo().upsertJournalSchema(auth.session.userId, body);
    return applyNoteCors(jsonOk({ schema }), origin);
  } catch (err) {
    return applyNoteCors(handleApiError(err), origin);
  }
}
