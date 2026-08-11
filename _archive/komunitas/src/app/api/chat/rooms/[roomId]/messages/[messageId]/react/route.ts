import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import {
  assertCanAccessChatRoom,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { reactToMessageSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ roomId: string; messageId: string }>;
};

/**
 * Toggle a Discord-style emoji reaction.
 * Resolves the Prisma User from client-auth headers (localStorage ids often
 * differ from DB ids) so reactions persist across message polls.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { roomId, messageId } = await context.params;
    const body = reactToMessageSchema.parse(await request.json());

    const email = (await resolveTrustedEmail(request)) ?? undefined;
    const headerUserId = request.headers.get("x-user-id")?.trim();
    const headerName = request.headers.get("x-user-name")?.trim();
    const headerRole = request.headers.get("x-user-role")?.trim();

    const viewer = await resolveChatRoomViewerFromEmail(email, {
      createIfMissing: true,
      userId: headerUserId,
      name: headerName,
      role: headerRole,
    });
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

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const message = await db.chatMessage.findFirst({
      where: { id: messageId, roomId, deletedAt: null },
    });

    if (!message) {
      return jsonError("Message not found", 404);
    }

    const existing = await db.chatMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji: body.emoji,
        },
      },
    });

    if (existing) {
      await db.chatMessageReaction.delete({ where: { id: existing.id } });
      return jsonOk({ removed: true, emoji: body.emoji, userId: user.id });
    }

    const reaction = await db.chatMessageReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji: body.emoji,
      },
      include: {
        user: { select: { id: true, nama: true } },
      },
    });

    return jsonOk({ reaction }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
