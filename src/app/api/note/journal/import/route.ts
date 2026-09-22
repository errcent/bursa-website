import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { parseJournalCsv } from "@/lib/note/csv";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { isBodyTooLarge } from "@/lib/note/request-limits";
import { NOTE_IMPORT_BODY_MAX_BYTES } from "@/lib/note/resource-limits";
import { getNoteRepo } from "@/lib/note/repo";

export const dynamic = "force-dynamic";

/**
 * Import / restore journal data (v3 P3).
 * POST /api/note/journal/import
 * Body: { csv: "..." } or { json: { entries: [...] } }
 *
 * For cross-device sync: export from device A → import to device B.
 */
export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_import", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  if (isBodyTooLarge(request, NOTE_IMPORT_BODY_MAX_BYTES)) {
    return applyNoteCors(jsonError("Data too large.", 413), origin);
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { csv?: string; json?: { entries?: unknown[] } }
      | null;

    let entries: unknown[] = [];

    if (body?.json?.entries && Array.isArray(body.json.entries)) {
      entries = body.json.entries;
    } else if (body?.csv) {
      const parsed = parseJournalCsv(body.csv);
      entries = parsed.entries;
    } else {
      return applyNoteCors(jsonError("Pass csv= or json.entries.", 400), origin);
    }

    if (!entries.length) {
      return applyNoteCors(jsonError("No entries to import.", 400), origin);
    }

    const repo = getNoteRepo();
    let imported = 0;
    for (const entry of entries) {
      try {
        await repo.createEntry(auth.session.userId, entry as never);
        imported++;
      } catch {
        /* skip invalid entry */
      }
    }

    return applyNoteCors(jsonOk({ imported }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
