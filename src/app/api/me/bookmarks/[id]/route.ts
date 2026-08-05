import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) return jsonError("Autentikasi diperlukan.", 401);

    const item = await db.bookmarkItem.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!item) return jsonError("Bookmark tidak ditemukan.", 404);

    await db.bookmarkItem.delete({ where: { id: item.id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
