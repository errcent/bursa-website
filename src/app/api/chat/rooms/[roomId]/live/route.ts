import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { setRoomLiveSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const body = setRoomLiveSchema.parse(await request.json());

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: { mentor: { select: { userId: true } } },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const membership = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: body.userId } },
    });

    const isMentor =
      room.mentor?.userId === body.userId || membership?.role === "MENTOR";

    if (!isMentor) {
      return jsonError("Only mentors can start or end a live session", 403);
    }

    const updated = await db.chatRoom.update({
      where: { id: roomId },
      data: body.isLive
        ? {
            isLive: true,
            liveStartedAt: new Date(),
            liveTitle: body.liveTitle?.trim() || "Sesi live mentor",
          }
        : {
            isLive: false,
            liveStartedAt: null,
            liveTitle: null,
          },
    });

    await db.chatAuditLog.create({
      data: {
        roomId,
        userId: body.userId,
        action: body.isLive ? "LIVE_STARTED" : "LIVE_ENDED",
        metadata: {
          liveTitle: updated.liveTitle,
        },
      },
    });

    if (body.isLive) {
      await db.chatMessage.create({
        data: {
          roomId,
          userId: body.userId,
          content: `🔴 Mentor sedang live${updated.liveTitle ? `: ${updated.liveTitle}` : ""}`,
          messageType: "ANNOUNCEMENT",
          metadata: {
            kind: "live_started",
            liveTitle: updated.liveTitle,
          },
        },
      });
    }

    return jsonOk({
      room: {
        id: updated.id,
        isLive: updated.isLive,
        liveStartedAt: updated.liveStartedAt?.toISOString() ?? null,
        liveTitle: updated.liveTitle,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
