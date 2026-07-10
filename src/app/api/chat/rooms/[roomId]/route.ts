import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  assertCanAccessChatRoom,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";
import { updateChatRoomSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        mentor: {
          select: {
            id: true,
            slug: true,
            initials: true,
            title: true,
            avatarUrl: true,
            user: { select: { id: true, nama: true } },
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const viewer = await resolveChatRoomViewerFromEmail(
      request.headers.get("x-user-email"),
      {
        createIfMissing: true,
        userId: request.headers.get("x-user-id"),
        name: request.headers.get("x-user-name"),
        role: request.headers.get("x-user-role"),
      }
    );
    const access = await assertCanAccessChatRoom({ room, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    return jsonOk({ room });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const body = updateChatRoomSchema.parse(await request.json());

    const existing = await db.chatRoom.findUnique({ where: { id: roomId } });
    if (!existing) {
      return jsonError("Chat room not found", 404);
    }

    const viewer = await resolveChatRoomViewerFromEmail(
      request.headers.get("x-user-email"),
      {
        createIfMissing: true,
        userId: request.headers.get("x-user-id"),
        name: request.headers.get("x-user-name"),
        role: request.headers.get("x-user-role"),
      }
    );
    const access = await assertCanAccessChatRoom({ room: existing, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    const data: {
      name?: string;
      description?: string | null;
      isLive?: boolean;
      liveStartedAt?: Date | null;
      liveTitle?: string | null;
    } = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;

    if (body.isLive !== undefined) {
      data.isLive = body.isLive;
      if (body.isLive) {
        data.liveStartedAt = new Date();
        data.liveTitle = body.liveTitle ?? existing.liveTitle ?? "Sesi live mentor";
      } else {
        data.liveStartedAt = null;
        data.liveTitle = null;
      }
    } else if (body.liveTitle !== undefined) {
      data.liveTitle = body.liveTitle;
    }

    const room = await db.chatRoom.update({
      where: { id: roomId },
      data,
      include: {
        mentor: {
          select: { id: true, slug: true, initials: true, title: true },
        },
      },
    });

    return jsonOk({ room });
  } catch (error) {
    return handleApiError(error);
  }
}
