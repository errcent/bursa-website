import { NextRequest } from "next/server";
import { ChatMemberRole } from "@prisma/client";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import {
  assertCanAccessChatRoom,
  ensureMentorOwnerMembership,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

function mapRole(role: "MEMBER" | "MODERATOR" | "MENTOR") {
  if (role === "MENTOR") return "mentor";
  if (role === "MODERATOR") return "moderator";
  return "member";
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        mentorId: true,
        roomKind: true,
        isStaffCollaboration: true,
        isProtected: true,
        isActive: true,
      },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const email = await resolveTrustedEmail(request);
    if (!email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const viewer = await resolveChatRoomViewerFromEmail(email, {
      createIfMissing: false,
      userId: request.headers.get("x-user-id"),
      name: request.headers.get("x-user-name"),
      role: request.headers.get("x-user-role"),
    });

    const access = await assertCanAccessChatRoom({ room, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    if (room.mentorId) {
      await ensureMentorOwnerMembership({
        roomId,
        mentorProfileId: room.mentorId,
      });
    }

    const members = await db.chatRoomMember.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            role: true,
            bio: true,
            avatarUrl: true,
            mentorProfile: {
              select: {
                id: true,
                slug: true,
                avatarUrl: true,
                initials: true,
                bio: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return jsonOk({
      members: members.map((m) => {
        const name = m.user.nama;
        const mentor = m.user.mentorProfile;
        const isRoomOwner =
          Boolean(room.mentorId) && mentor?.id === room.mentorId;
        const effectiveRole =
          isRoomOwner && m.role !== ChatMemberRole.MENTOR
            ? ChatMemberRole.MENTOR
            : m.role;
        return {
          id: m.user.id,
          membershipId: m.id,
          name,
          initials: mentor?.initials ?? name.slice(0, 2).toUpperCase(),
          role: mapRole(effectiveRole),
          isOnline: false,
          avatarUrl: mentor?.avatarUrl ?? m.user.avatarUrl ?? undefined,
          username: name.split(" ")[0]?.toLowerCase(),
          profileSlug: mentor?.slug,
          bio: mentor?.bio ?? m.user.bio ?? undefined,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
