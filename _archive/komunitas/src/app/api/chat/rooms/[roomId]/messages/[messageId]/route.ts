import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ roomId: string; messageId: string }>;
};

/**
 * Soft-delete a chat message. Admin-only — enforced server-side via DB role.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return unauthorized();
    }

    const { roomId, messageId } = await context.params;

    const message = await db.chatMessage.findFirst({
      where: { id: messageId, roomId, deletedAt: null },
    });

    if (!message) {
      return jsonError("Pesan tidak ditemukan.", 404);
    }

    const deletedAt = new Date();
    await db.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt },
    });

    await db.chatAuditLog.create({
      data: {
        roomId,
        userId: admin.id,
        action: "MESSAGE_DELETED",
        metadata: {
          messageId,
          deletedBy: admin.id,
          originalAuthorId: message.userId,
        },
      },
    });

    return jsonOk({ messageId, deletedAt: deletedAt.toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}
