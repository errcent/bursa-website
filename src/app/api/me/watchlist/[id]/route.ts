import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { deleteWatchlistItemSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rawBody = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = deleteWatchlistItemSchema.safeParse(rawBody);
    const body = parsed.success ? parsed.data : {};

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: body.userId || request.nextUrl.searchParams.get("userId"),
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
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
