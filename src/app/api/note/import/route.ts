import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { parseJournalCsv } from "@/lib/note/csv";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

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
    return applyNoteCors(handleApiError(error), origin);
  }
}
