import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { updateChatMemberRoleSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ roomId: string; userId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { roomId, userId } = await context.params;
    const body = updateChatMemberRoleSchema.parse(await request.json());

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: { mentor: { select: { userId: true } } },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const requester = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: body.requestedByUserId } },
    });

    const isRoomMentor =
      room.mentor?.userId === body.requestedByUserId || requester?.role === "MENTOR";

    if (!isRoomMentor) {
      return jsonError("Only mentors can change member roles", 403);
    }

    if (body.role === "MENTOR" && room.mentor?.userId !== userId) {
      return jsonError("Cannot promote another user to mentor role", 400);
    }

    const membership = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) {
      return jsonError("Member not found in this room", 404);
    }

    if (membership.role === "MENTOR" && body.role !== "MENTOR") {
      return jsonError("Cannot demote the room mentor", 400);
    }

    const updated = await db.chatRoomMember.update({
      where: { id: membership.id },
      data: { role: body.role },
      include: {
        user: { select: { id: true, nama: true } },
      },
    });

    await db.chatAuditLog.create({
      data: {
        roomId,
        userId: body.requestedByUserId,
        action: "MEMBER_ROLE_UPDATED",
        metadata: {
          targetUserId: userId,
          role: body.role,
        },
      },
    });

    return jsonOk({ member: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
