import { NextRequest } from "next/server";

import { instrumentToUi } from "@/lib/admin/server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
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
    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: request.nextUrl.searchParams.get("userId"),
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
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
    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
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
