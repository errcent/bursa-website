import { ChatBranchVisibility, ChatRoomKind } from "@prisma/client";
import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  assertCanAccessChatRoom,
  resolveChatRoomViewerFromEmail,
} from "@/lib/chat/db-rooms";
import {
  canUserSendInBranch,
  canUserViewBranch,
  resolveMessageHistoryScope,
} from "@/lib/chat/room-kinds";
import { resolveLastReadMessageId } from "@/lib/chat/unread";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { createChatMessageSchema } from "@/lib/validations/api";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

/**
 * Bridge client-auth (localStorage) → Prisma User.
 * New registrants often exist only in the browser until the first API call.
 */
async function resolveUser(
  request: NextRequest,
  body?: { userId?: string; name?: string; role?: string },
  options?: { createIfMissing?: boolean }
) {
  const email = request.headers.get("x-user-email")?.trim().toLowerCase();
  const headerUserId = request.headers.get("x-user-id")?.trim();
  const headerName = request.headers.get("x-user-name")?.trim();
  const headerRole = request.headers.get("x-user-role")?.trim();
  const userId = body?.userId?.trim() || headerUserId || "";

  if (!email && !userId) return null;

  return resolveRequestUser(
    {
      userId,
      email: email || undefined,
      name: body?.name || headerName || undefined,
      role: body?.role || headerRole || undefined,
    },
    { createIfMissing: options?.createIfMissing ?? true }
  );
}

async function isHubOwner(userId: string, mentorId: string | null | undefined) {
  if (!mentorId) return false;
  const profile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    select: { userId: true },
  });
  return profile?.userId === userId;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");
    const branchId = searchParams.get("branchId");

    const room = await db.chatRoom.findUnique({
      where: { id: roomId },
      include: { branches: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const user = await resolveUser(request, undefined, { createIfMissing: true });
    const viewer = user
      ? {
          id: user.id,
          role: user.role,
          mentorProfileId:
            (
              await db.mentorProfile.findUnique({
                where: { userId: user.id },
                select: { id: true },
              })
            )?.id ?? null,
        }
      : await resolveChatRoomViewerFromEmail(
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

    let membership = user
      ? await db.chatRoomMember.findUnique({
          where: { roomId_userId: { roomId, userId: user.id } },
        })
      : null;

    // Auto-join public rooms on first view so joinedAt is set before history filter.
    if (!membership && user && room.roomKind === ChatRoomKind.PUBLIC) {
      membership = await db.chatRoomMember.upsert({
        where: { roomId_userId: { roomId, userId: user.id } },
        create: { roomId, userId: user.id, role: "MEMBER" },
        update: {},
      });
    }

    const owner = user ? await isHubOwner(user.id, room.mentorId) : false;
    const historyScope = resolveMessageHistoryScope({
      membership,
      userRole: user?.role,
      isRoomOwner: owner,
    });
    const historyHidden = historyScope.kind !== "full";

    let effectiveBranchId =
      branchId ||
      (room.roomKind === ChatRoomKind.MENTOR_COMMUNITY &&
      !room.isStaffCollaboration &&
      room.branches[0]
        ? room.branches[0].id
        : null);

    if (effectiveBranchId) {
      const branch =
        room.branches.find((b) => b.id === effectiveBranchId) ??
        (await db.chatBranch.findFirst({
          where: { id: effectiveBranchId, roomId, isActive: true },
        }));

      if (branch) {
        const viewCheck = canUserViewBranch({
          room,
          branch,
          membership,
          userRole: user?.role,
          isRoomOwner: owner,
        });
        if (!viewCheck.allowed) {
          return jsonError(viewCheck.reason ?? "Tidak diizinkan melihat cabang ini.", 403);
        }
      }
    } else if (
      room.roomKind === ChatRoomKind.MENTOR_COMMUNITY &&
      !room.isStaffCollaboration
    ) {
      // Pick first visible branch for the viewer
      const visible = room.branches.find((b) => {
        const check = canUserViewBranch({
          room,
          branch: b,
          membership,
          userRole: user?.role,
          isRoomOwner: owner,
        });
        return check.allowed;
      });
      effectiveBranchId = visible?.id ?? null;
    }

    // Strip private branches from payload for unauthorized viewers
    const safeBranches = room.branches.filter((b) => {
      if (b.visibility !== ChatBranchVisibility.PRIVATE) return true;
      return canUserViewBranch({
        room,
        branch: b,
        membership,
        userRole: user?.role,
        isRoomOwner: owner,
      }).allowed;
    });

    if (historyScope.kind === "empty") {
      return jsonOk({
        room: { ...room, branches: safeBranches },
        messages: [],
        nextCursor: null,
        lastReadAt: null,
        lastReadMessageId: null,
        historyHidden: true,
      });
    }

    const createdAtFilter: { lt?: Date; gte?: Date } = {};
    if (cursor) createdAtFilter.lt = new Date(cursor);
    if (historyScope.kind === "since") createdAtFilter.gte = historyScope.since;

    const messages = await db.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(effectiveBranchId
          ? { branchId: effectiveBranchId }
          : room.isStaffCollaboration || room.roomKind === ChatRoomKind.PUBLIC
            ? {}
            : { branchId: null }),
        ...(Object.keys(createdAtFilter).length > 0
          ? { createdAt: createdAtFilter }
          : {}),
      },
      include: {
        user: {
          select: { id: true, nama: true, role: true, avatarUrl: true, bio: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, nama: true } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: { select: { nama: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const readCursor = user
      ? await resolveLastReadMessageId(roomId, user.id, effectiveBranchId, {
          historySince:
            historyScope.kind === "since" ? historyScope.since : null,
        })
      : { lastReadAt: null, lastReadMessageId: null };

    return jsonOk({
      room: { ...room, branches: safeBranches },
      messages: messages.reverse(),
      nextCursor:
        messages.length === limit ? messages[0]?.createdAt.toISOString() : null,
      lastReadAt: readCursor.lastReadAt,
      lastReadMessageId: readCursor.lastReadMessageId,
      historyHidden,
      /** Prisma User.id — client auth often uses a different localStorage id. */
      viewerId: user?.id ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { roomId } = await context.params;
    const raw = await request.json();
    const body = createChatMessageSchema.parse(raw);
    const branchId =
      typeof raw.branchId === "string" && raw.branchId.trim()
        ? raw.branchId.trim()
        : null;

    const room = await db.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return jsonError("Chat room not found", 404);
    }

    const user = await resolveUser(
      request,
      { userId: body.userId },
      { createIfMissing: true }
    );
    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 401);
    }

    const viewer = {
      id: user.id,
      role: user.role,
      mentorProfileId:
        (
          await db.mentorProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
          })
        )?.id ?? null,
    };
    const access = await assertCanAccessChatRoom({ room, viewer });
    if (!access.ok) {
      return jsonError(access.error, access.status);
    }

    let branch = null;
    if (branchId) {
      branch = await db.chatBranch.findFirst({
        where: { id: branchId, roomId, isActive: true },
      });
      if (!branch) {
        return jsonError("Cabang tidak ditemukan di ruang ini.", 404);
      }
    } else if (
      !room.isStaffCollaboration &&
      room.roomKind === ChatRoomKind.MENTOR_COMMUNITY
    ) {
      return jsonError("branchId wajib untuk grup mentor.", 400);
    }

    const membership = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
    });

    // Auto-join public rooms on first send
    let effectiveMembership = membership;
    if (!membership && room.roomKind === ChatRoomKind.PUBLIC) {
      effectiveMembership = await db.chatRoomMember.create({
        data: { roomId, userId: user.id, role: "MEMBER" },
      });
    }

    const owner = await isHubOwner(user.id, room.mentorId);

    const sendCheck = canUserSendInBranch({
      room,
      branch,
      membership: effectiveMembership,
      userRole: user.role,
      isRoomOwner: owner,
    });
    if (!sendCheck.allowed) {
      return jsonError(sendCheck.reason ?? "Tidak diizinkan mengirim pesan.", 403);
    }

    if (body.messageType === "SYSTEM") {
      return jsonError("Pesan sistem tidak dapat dikirim secara manual.", 400);
    }

    const mentionIds = Array.from(
      new Set(
        (body.mentions ?? []).filter(
          (id): id is string => typeof id === "string" && id.length > 0 && id !== user.id
        )
      )
    );
    const baseMeta =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? { ...(body.metadata as Record<string, unknown>) }
        : {};
    if (mentionIds.length > 0) {
      baseMeta.mentions = mentionIds;
    }
    const metadataPayload =
      Object.keys(baseMeta).length > 0
        ? (baseMeta as import("@prisma/client").Prisma.InputJsonValue)
        : undefined;

    const message = await db.chatMessage.create({
      data: {
        roomId,
        branchId: branch?.id ?? null,
        userId: user.id,
        content: body.content,
        messageType: body.messageType,
        metadata: metadataPayload,
        replyToId: body.replyToId,
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

    await db.chatAuditLog.create({
      data: {
        roomId,
        userId: user.id,
        action: "MESSAGE_SENT",
        metadata: {
          messageId: message.id,
          messageType: message.messageType,
          branchId: branch?.id ?? null,
        },
      },
    });

    return jsonOk({ message }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
