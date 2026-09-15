import { NextRequest, NextResponse } from "next/server";

import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import {
  getEconomicCalendar,
  parseFilterFromSearchParams,
} from "@/lib/note/economic-calendar/fetch";
import { applyNoteCors, attachNoteSessionCookies, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) {
    return applyNoteCors(auth.error, origin);
  }

  const limited = await enforceNoteRateLimit(request, "econ", auth.session);
  if (!limited.ok) {
    return applyNoteCors(limited.response, origin);
  }

  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") === "en" ? "en" : "id";
  const volatilityParam = searchParams.get("volatility");
  const volatilityCountdown =
    volatilityParam === "0" || volatilityParam === "false"
      ? false
      : volatilityParam === "1" || volatilityParam === "true"
        ? true
        : process.env.NOTE_ECON_VOLATILITY_DEFAULT !== "0";

  const filter = parseFilterFromSearchParams({
    impacts: searchParams.get("impacts"),
    currencies: searchParams.get("currencies"),
    eventTypes: searchParams.get("eventTypes"),
    impact: searchParams.get("impact"),
    currency: searchParams.get("currency"),
  });

  const payload = await getEconomicCalendar({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    locale,
    filter,
    volatilityCountdown,
  });

  const res = NextResponse.json(payload);
  res.headers.set("Cache-Control", "private, max-age=60, stale-while-revalidate=120");
  return applyNoteCors(attachNoteSessionCookies(request, res, auth.session), origin);
}
