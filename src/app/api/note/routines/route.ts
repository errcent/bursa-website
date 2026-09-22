import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import {
  EMPTY_ROUTINES,
  ROUTINES_BLOB,
  type RoutinesState,
} from "@/lib/note/routines";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

function cuid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadState(apexUserId: string): Promise<RoutinesState> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, ROUTINES_BLOB)) as unknown;
  if (!raw || typeof raw !== "object") return { ...EMPTY_ROUTINES, items: [], checks: {}, misses: [] };
  const state = raw as Partial<RoutinesState>;
  return {
    items: Array.isArray(state.items) ? state.items : [],
    checks: state.checks && typeof state.checks === "object" ? state.checks : {},
    misses: Array.isArray(state.misses) ? state.misses : [],
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  try {
    return applyNoteCors(jsonOk({ routines: await loadState(auth.session.userId) }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add-item"),
    payload: z.object({
      label: z.string().trim().min(1).max(120),
      phase: z.enum(["pre", "during", "post"]),
      weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional().default([]),
    }),
  }),
  z.object({
    action: z.literal("toggle-check"),
    payload: z.object({ itemId: z.string().min(1).max(64), date: z.string().regex(/^\d{4}-\d{2}-\d{2}/) }),
  }),
  z.object({
    action: z.literal("delete-item"),
    payload: z.object({ itemId: z.string().min(1).max(64) }),
  }),
  z.object({
    action: z.literal("log-miss"),
    payload: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
      symbol: z.string().trim().min(1).max(32).transform((s) => s.toUpperCase()),
      direction: z.enum(["long", "short"]).nullable().optional(),
      reason: z.string().trim().min(1).max(280),
      thesis: z.string().trim().max(500).nullable().optional(),
    }),
  }),
  z.object({
    action: z.literal("delete-miss"),
    payload: z.object({ missId: z.string().min(1).max(64) }),
  }),
]);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);
  const limited = await enforceNoteRateLimit(request, "journal_write", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return applyNoteCors(jsonError("Payload tidak valid.", 400), origin);

    const repo = getNoteRepo();
    const state = await loadState(auth.session.userId);
    const { action, payload } = parsed.data as { action: string; payload: Record<string, unknown> };

    if (action === "add-item") {
      const p = payload as unknown as { label: string; phase: "pre" | "during" | "post"; weekdays: number[] };
      if (state.items.length >= 50) return applyNoteCors(jsonError("Maksimal 50 rutinitas.", 400), origin);
      state.items.push({ id: cuid(), label: p.label, phase: p.phase, weekdays: p.weekdays });
    } else if (action === "toggle-check") {
      const p = payload as unknown as { itemId: string; date: string };
      if (!state.items.some((i) => i.id === p.itemId)) {
        return applyNoteCors(jsonError("Rutinitas tidak ditemukan.", 404), origin);
      }
      const done = new Set(state.checks[p.date] ?? []);
      if (done.has(p.itemId)) done.delete(p.itemId);
      else done.add(p.itemId);
      state.checks[p.date] = [...done];
      const dates = Object.keys(state.checks).sort();
      for (const d of dates.slice(0, Math.max(0, dates.length - 91))) delete state.checks[d];
    } else if (action === "delete-item") {
      const p = payload as unknown as { itemId: string };
      state.items = state.items.filter((i) => i.id !== p.itemId);
    } else if (action === "log-miss") {
      const p = payload as unknown as { date: string; symbol: string; direction: "long" | "short" | null; reason: string; thesis: string | null };
      if (state.misses.length >= 500) return applyNoteCors(jsonError("Maksimal 500 miss tercatat.", 400), origin);
      state.misses.unshift({
        id: cuid(), date: p.date, symbol: p.symbol,
        direction: p.direction ?? null, reason: p.reason, thesis: p.thesis ?? null,
      });
    } else if (action === "delete-miss") {
      const p = payload as unknown as { missId: string };
      state.misses = state.misses.filter((m) => m.id !== p.missId);
    }

    await repo.setUserBlob(auth.session.userId, ROUTINES_BLOB, state);
    return applyNoteCors(jsonOk({ routines: state }), origin);
  } catch (error) {
    return applyNoteCors(handleApiError(error), origin);
  }
}
