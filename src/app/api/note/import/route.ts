import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { parseJournalCsv } from "@/lib/note/csv";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { isBodyTooLarge } from "@/lib/note/request-limits";
import { NOTE_IMPORT_BODY_MAX_BYTES } from "@/lib/note/resource-limits";
import { getNoteRepo } from "@/lib/note/repo";

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
    return applyNoteCors(jsonError("File impor terlalu besar.", 413), origin);
  }

  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    let text = "";
    if (file instanceof File) {
      text = await file.text();
    } else {
      const body = (await request.json().catch(() => null)) as { csv?: string } | null;
      text = body?.csv ?? "";
    }
    if (!text.trim()) {
      return applyNoteCors(jsonError("Lampirkan file CSV atau field csv.", 400), origin);
    }

    const { entries, errors } = parseJournalCsv(text);
    if (entries.length === 0) {
      return applyNoteCors(jsonError(errors[0] ?? "Tidak ada baris yang bisa diimpor.", 400), origin);
    }

    const repo = getNoteRepo();
    const created = [];
    for (const input of entries) {
      created.push(await repo.createEntry(auth.session.userId, input));
    }
    return applyNoteCors(jsonOk({ imported: created.length, errors, entries: created }), origin);
  } catch (error) {
    if (error instanceof Error && error.message === "NOTE_JOURNAL_CAP") {
      return applyNoteCors(jsonError("Batas entry jurnal tercapai.", 413), origin);
    }
    return applyNoteCors(handleApiError(error), origin);
  }
}
