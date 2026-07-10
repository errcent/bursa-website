import { NextRequest } from "next/server";

import { instrumentToUi } from "@/lib/admin/server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { createWatchlistItemSchema } from "@/lib/validations/api";

function serializeWatchlistItem(item: {
  id: string;
  ticker: string;
  instrument: "SAHAM" | "CRYPTO" | "FOREX";
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: item.id,
    ticker: item.ticker,
    instrument: instrumentToUi(item.instrument),
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
  };
}

/**
 * Learner watchlist: GET list / POST add ticker.
 * Query/headers: ?userId=&email= or x-user-email.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email =
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      { userId: userId ?? "", email },
      { createIfMissing: false }
    );

    if (!user) {
      return jsonOk({ items: [] });
    }

    const items = await db.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({ items: items.map(serializeWatchlistItem) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createWatchlistItemSchema.parse(await request.json());
    const headerEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase() || headerEmail;

    if (!body.userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser({
      userId: body.userId ?? "",
      email,
      name: body.name,
      role: body.role,
    });

    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    const existing = await db.watchlistItem.findUnique({
      where: {
        userId_ticker: {
          userId: user.id,
          ticker: body.ticker,
        },
      },
    });

    if (existing) {
      return jsonError(`${body.ticker} sudah ada di watchlist.`, 409);
    }

    const item = await db.watchlistItem.create({
      data: {
        userId: user.id,
        ticker: body.ticker,
        instrument: body.instrument,
        notes: body.notes,
      },
    });

    return jsonOk({ item: serializeWatchlistItem(item) }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
