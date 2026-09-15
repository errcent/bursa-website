import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { buildDemoTrackStore } from "@/lib/note/track/demo-seed";
import { parseTrackStore } from "@/lib/note/track/parse-store";
import { readServerTrackStore, writeServerTrackStore } from "@/lib/note/track/server-persistence";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, attachNoteSessionCookies, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { isBodyTooLarge } from "@/lib/note/request-limits";
import {
  NOTE_TRACK_BODY_MAX_BYTES,
  NOTE_TRACK_MAX_PORTFOLIOS,
  NOTE_TRACK_MAX_TRANSACTIONS,
} from "@/lib/note/resource-limits";
import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";

export const dynamic = "force-dynamic";

const trackSchema = z
  .object({
    version: z.literal(1),
    portfolios: z.array(
      z.object({
        id: z.string().max(64),
        name: z.string().max(120),
        createdAt: z.string().max(40),
      })
    ),
    transactions: z.array(
      z.object({
        id: z.string().max(64),
        portfolioId: z.string().max(64),
        type: z.enum(["buy", "sell", "transfer_in", "mark"]),
        symbol: z.string().max(32),
        quantity: z.number().finite(),
        unitPrice: z.number().finite().nullable(),
        quoteCurrency: z.enum(["IDR", "USD", "USDT"]),
        fee: z.number().finite(),
        note: z.string().max(500).nullable(),
        executedAt: z.string().max(40),
        createdAt: z.string().max(40),
      })
    ),
  })
  .superRefine((data, ctx) => {
    if (data.portfolios.length > NOTE_TRACK_MAX_PORTFOLIOS) {
      ctx.addIssue({
        code: "custom",
        message: "Terlalu banyak portfolio.",
        path: ["portfolios"],
      });
    }
    if (data.transactions.length > NOTE_TRACK_MAX_TRANSACTIONS) {
      ctx.addIssue({
        code: "custom",
        message: "Terlalu banyak transaksi.",
        path: ["transactions"],
      });
    }
  });

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "track_read", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    let store = await readServerTrackStore(auth.session.userId);
    let demo = false;
    if (store.portfolios.length === 0 && isNoteOpenAccessPeriod()) {
      store = buildDemoTrackStore();
      demo = true;
      await writeServerTrackStore(auth.session.userId, store);
    }
    const res = jsonOk({
      store,
      demo,
      openAccess: isNoteOpenAccessPeriod(),
      persistence: "local" as const,
    });
    res.headers.set("Cache-Control", "no-store");
    return applyNoteCors(attachNoteSessionCookies(request, res, auth.session), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "track_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  if (isBodyTooLarge(request, NOTE_TRACK_BODY_MAX_BYTES)) {
    return applyNoteCors(jsonError("Payload track terlalu besar.", 413), origin);
  }

  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return applyNoteCors(jsonError("Payload track tidak valid.", 400), origin);
    }
    const store = parseTrackStore(parsed.data);
    await writeServerTrackStore(auth.session.userId, store);
    const res = jsonOk({ ok: true, openAccess: isNoteOpenAccessPeriod() });
    res.headers.set("Cache-Control", "no-store");
    return applyNoteCors(attachNoteSessionCookies(request, res, auth.session), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
