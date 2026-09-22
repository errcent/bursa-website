import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { deleteSyncAccount, listSyncAccounts, saveSyncAccount } from "@/lib/note/sync/run";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    // Secrets never leave the server; list returns masked hints only.
    return applyNoteCors(jsonOk({ accounts: await listSyncAccounts(auth.session.userId) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

const saveSchema = z.object({
  broker: z.enum(["binance", "ibkr-flex"]),
  label: z.string().trim().max(40).optional().default(""),
  apiKey: z.string().trim().max(256).optional().default(""),
  apiSecret: z.string().trim().max(512).optional().default(""),
  token: z.string().trim().max(256).optional().default(""),
  queryId: z.string().trim().max(64).optional().default(""),
  symbols: z.array(z.string().trim().max(24)).max(20).optional().default([]),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "broker_sync", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("Payload tidak valid.", 400), origin);
    const { broker, label, apiKey, apiSecret, token, queryId, symbols } = parsed.data;

    const credentials: Record<string, string> =
      broker === "binance" ? { apiKey, apiSecret } : { token, queryId };
    if (Object.values(credentials).some((v) => !v)) {
      return applyNoteCors(jsonError("Lengkapi kredensial read-only.", 400), origin);
    }
    if (broker === "binance" && symbols.length === 0) {
      return applyNoteCors(jsonError("Tambahkan minimal satu simbol (mis. BTCUSDT).", 400), origin);
    }

    const account = await saveSyncAccount(auth.session.userId, { broker, label, credentials, symbols });
    return applyNoteCors(jsonOk({ account }), origin);
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
    const ok = await deleteSyncAccount(auth.session.userId, id);
    if (!ok) return applyNoteCors(jsonError("Akun tidak ditemukan.", 404), origin);
    return applyNoteCors(jsonOk({ deleted: true }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
