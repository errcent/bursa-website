import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
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

    const email = request.headers.get("x-user-email")?.trim().toLowerCase();
    const headerUserId = request.headers.get("x-user-id")?.trim();
    const headerName = request.headers.get("x-user-name")?.trim();
    const headerRole = request.headers.get("x-user-role")?.trim();

    const user = await resolveRequestUser(
      {
        userId: body.userId?.trim() || headerUserId || "",
        email: email || undefined,
        name: headerName || undefined,
        role: headerRole || undefined,
      },
      { createIfMissing: true }
    );

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
