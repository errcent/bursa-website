import { ChatRoomKind } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import {
  assertCanAccessChatRoom,
  listChatRoomsForViewer,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { createTradingPollSchema } from "@/lib/validations/api";

type PollOptionRecord = {
  id: string;
  label: string;
  votes: number;
};

/** Strip any legacy voter identities from stored options before returning to viewers (QC-20260719-23). */
function sanitizePollOptions(raw: unknown): PollOptionRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const opt = item as Partial<PollOptionRecord & { voterIds?: unknown }>;
    return {
      id: typeof opt.id === "string" ? opt.id : `opt-${index + 1}`,
      label: typeof opt.label === "string" ? opt.label : `Opsi ${index + 1}`,
      votes: typeof opt.votes === "number" ? opt.votes : 0,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const roomId = searchParams.get("roomId");

    const email = (await resolveTrustedEmail(request)) ?? undefined;
    const viewer = await resolveChatRoomViewerFromEmail(email, {
      createIfMissing: true,
      userId: request.headers.get("x-user-id"),
      name: request.headers.get("x-user-name"),
      role: request.headers.get("x-user-role"),
    });
    if (!viewer) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    let accessibleRoomIds: string[];

    if (roomId) {
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

      accessibleRoomIds = [roomId];
    } else {
      const rooms = await listChatRoomsForViewer(viewer);
      accessibleRoomIds = rooms.map((r) => r.id);
    }

    const polls = await db.tradingPoll.findMany({
      where: {
        roomId: { in: accessibleRoomIds },
      },
      include: {
        room: {
          select: { id: true, name: true, slug: true, tier: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safePolls = polls.map((poll) => ({
      ...poll,
      options: sanitizePollOptions(poll.options),
    }));

    return jsonOk({ polls: safePolls });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createTradingPollSchema.parse(await request.json());

    const room = await db.chatRoom.findUnique({
      where: { id: body.roomId },
      include: { mentor: { select: { userId: true } } },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const membership = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: body.roomId, userId: user.id } },
    });

    const isMentor =
      room.mentor?.userId === user.id || membership?.role === "MENTOR";

    if (!isMentor) {
      return jsonError("Only mentors can create polls", 403);
    }

    let branchId: string | null = body.branchId ?? null;
    if (branchId) {
      const branch = await db.chatBranch.findFirst({
        where: { id: branchId, roomId: body.roomId, isActive: true },
        select: { id: true },
      });
      if (!branch) {
        return jsonError("Cabang tidak ditemukan di ruang ini.", 404);
      }
      branchId = branch.id;
    } else if (
      !room.isStaffCollaboration &&
      room.roomKind === ChatRoomKind.MENTOR_COMMUNITY
    ) {
      return jsonError("branchId wajib untuk grup mentor.", 400);
    }

    const options: PollOptionRecord[] = body.options.map((label, index) => ({
      id: `opt-${index + 1}`,
      label: label.trim(),
      votes: 0,
    }));

    const expiresAt =
      body.durationHours != null
        ? new Date(Date.now() + body.durationHours * 60 * 60 * 1000)
        : null;

    const poll = await db.tradingPoll.create({
      data: {
        roomId: body.roomId,
        question: body.question.trim(),
        options,
        expiresAt: expiresAt ?? undefined,
      },
      include: {
        room: {
          select: { id: true, name: true, slug: true, tier: true },
        },
      },
    });

    const message = await db.chatMessage.create({
      data: {
        roomId: body.roomId,
        branchId,
        userId: user.id,
        content: body.question.trim(),
        messageType: "POLL",
        metadata: {
          pollId: poll.id,
          question: poll.question,
          options,
          totalVotes: 0,
          endsAt: expiresAt?.toISOString() ?? null,
        },
      },
      include: {
        user: {
          select: { id: true, nama: true, role: true, avatarUrl: true, bio: true },
        },
        reactions: true,
        replyTo: {
          select: {
            id: true,
            content: true,
            user: { select: { nama: true } },
          },
        },
      },
    });

    return jsonOk({ poll, message, viewerId: user.id }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
