import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  assertCanAccessChatRoom,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { markRoomAsRead } from "@/lib/chat/unread";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * Mark the current user's read cursor for this room (ChatRoomMember.lastReadAt).
 * Call when the user opens the room or is actively viewing the message list.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const viewer = await resolveChatRoomViewerFromEmail(
      request.headers.get("x-user-email"),
      {
        createIfMissing: true,
        userId: request.headers.get("x-user-id"),
        name: request.headers.get("x-user-name"),
        role: request.headers.get("x-user-role"),
      }
    );
    if (!viewer) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        roomKind: true,
        mentorId: true,
        isActive: true,
        isStaffCollaboration: true,
        isProtected: true,
      },
    });
    if (!room || !room.isActive) {
      return jsonError("Chat room not found", 404);
    }

    const access = await assertCanAccessChatRoom({ room, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    const result = await markRoomAsRead({
      roomId,
      userId: viewer.id,
    });
    if (!result) {
      return jsonError(
        "Anda belum menjadi anggota ruang ini. Bergabung terlebih dahulu.",
        403
      );
    }

    return jsonOk({
      lastReadAt: result.lastReadAt.toISOString(),
      unreadCount: 0,
      mentionUnreadCount: 0,
      hasMention: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
