import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import {
  JOURNAL_ACCOUNTS_BLOB,
  normalizeMultipliers,
  type JournalAccount,
} from "@/lib/note/accounts";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

function cuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadAccounts(apexUserId: string): Promise<JournalAccount[]> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, JOURNAL_ACCOUNTS_BLOB)) as unknown;
  return Array.isArray(raw) ? (raw as JournalAccount[]) : [];
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    return applyNoteCors(jsonOk({ accounts: await loadAccounts(auth.session.userId) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

const saveSchema = z.object({
  label: z.string().trim().min(1).max(40),
  method: z.enum(["fifo", "lifo", "average"]),
  multipliers: z.record(z.string().trim().max(24), z.number().finite().min(0).max(1_000_000)).optional().default({}),
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
    const accounts = await loadAccounts(auth.session.userId);
    if (accounts.length >= 20) return applyNoteCors(jsonError("Maksimal 20 akun.", 400), origin);
    const existing = accounts.findIndex((a) => a.label.toLowerCase() === parsed.data.label.toLowerCase());
    const record: JournalAccount = {
      id: existing >= 0 ? accounts[existing]!.id : cuid(),
      label: parsed.data.label,
      method: parsed.data.method,
      multipliers: normalizeMultipliers(parsed.data.multipliers),
      createdAt: existing >= 0 ? accounts[existing]!.createdAt : new Date().toISOString(),
    };
    if (existing >= 0) accounts[existing] = record;
    else accounts.push(record);
    await repo.setUserBlob(auth.session.userId, JOURNAL_ACCOUNTS_BLOB, accounts);
    return applyNoteCors(jsonOk({ accounts }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) return applyNoteCors(jsonError("id wajib.", 400), origin);
    const repo = getNoteRepo();
    const accounts = await loadAccounts(auth.session.userId);
    const next = accounts.filter((a) => a.id !== id);
    if (next.length === accounts.length) return applyNoteCors(jsonError("Akun tidak ditemukan.", 404), origin);
    await repo.setUserBlob(auth.session.userId, JOURNAL_ACCOUNTS_BLOB, next);
    return applyNoteCors(jsonOk({ accounts: next }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
