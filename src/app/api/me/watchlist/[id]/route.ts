import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { deleteWatchlistItemSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/me/watchlist/[id] — remove a watchlist item owned by the signed-in user.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rawBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const body = deleteWatchlistItemSchema.parse(rawBody);

    const headerEmail = request.headers.get("x-user-email")?.trim().toLowerCase();
    const email =
      body.email?.trim().toLowerCase() ||
      headerEmail ||
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      undefined;
    const userId =
      body.userId || request.nextUrl.searchParams.get("userId") || undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      {
        userId: userId ?? "",
        email,
        name: body.name,
        role: body.role,
      },
      { createIfMissing: false }
    );

    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    const existing = await db.watchlistItem.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return jsonError("Item watchlist tidak ditemukan.", 404);
    }

    await db.watchlistItem.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
