import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { fetchUsdIdrSpot } from "@/lib/note/fx/usd-idr-spot";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "fx_spot", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  const rate = await fetchUsdIdrSpot();
  if (rate == null) {
    return applyNoteCors(jsonError("USD/IDR spot unavailable", 502), origin);
  }
  const res = jsonOk({
    rate,
    ticker: "USDIDR=X",
    source: "yahoo",
    fetchedAt: new Date().toISOString(),
  });
  res.headers.set("Cache-Control", "private, max-age=120");
  return applyNoteCors(res, origin);
}
