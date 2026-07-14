import { db } from "@/lib/db";
import {
  mentionTokensForName,
  messageMentionsViewer,
} from "@/lib/chat/mention-utils";
import type { ChatBranchInfo, ChatRoom } from "@/lib/chat/types";

type MembershipCursor = {
  lastReadAt: Date | null;
  joinedAt: Date;
};

function readSince(membership: MembershipCursor): Date {
  return membership.lastReadAt ?? membership.joinedAt;
}

function emptyMentionFields() {
  return {
    mentionUnreadCount: 0,
    hasMention: false,
  };
}

/**
 * Attach per-room (and optional per-branch) unread counts for messages from
 * others after the member's lastReadAt (falling back to joinedAt).
 * Also counts unread @mentions of the viewer (metadata.mentions or @name parse).
 */
export async function attachUnreadCounts(
  rooms: ChatRoom[],
  userId: string | null | undefined
): Promise<ChatRoom[]> {
  if (!userId || rooms.length === 0) return rooms;

  const roomIds = rooms.map((r) => r.id);
  const memberships = await db.chatRoomMember.findMany({
    where: { userId, roomId: { in: roomIds } },
    select: { roomId: true, lastReadAt: true, joinedAt: true },
  });

  if (memberships.length === 0) {
    return rooms.map((room) => ({
      ...room,
      unreadCount: 0,
      ...emptyMentionFields(),
      branches: room.branches?.map((b) => ({
        ...b,
        unreadCount: 0,
        ...emptyMentionFields(),
      })),
    }));
  }

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true },
  });
  const viewerMentionTokens = mentionTokensForName(viewer?.nama ?? "");

  const membershipByRoom = new Map(
    memberships.map((m) => [m.roomId, m as MembershipCursor])
  );

  const sinceDates = memberships.map((m) => readSince(m));
  const minSince = sinceDates.reduce(
    (min, d) => (d < min ? d : min),
    sinceDates[0]!
  );

  const recent = await db.chatMessage.findMany({
    where: {
      roomId: { in: roomIds },
      deletedAt: null,
      userId: { not: userId },
      createdAt: { gt: minSince },
    },
    select: {
      roomId: true,
      branchId: true,
      createdAt: true,
      content: true,
      metadata: true,
    },
  });

  const roomUnread = new Map<string, number>();
  const branchUnread = new Map<string, number>();
  const roomMentions = new Map<string, number>();
  const branchMentions = new Map<string, number>();

  for (const msg of recent) {
    const membership = membershipByRoom.get(msg.roomId);
    if (!membership) continue;
    if (msg.createdAt <= readSince(membership)) continue;

    roomUnread.set(msg.roomId, (roomUnread.get(msg.roomId) ?? 0) + 1);
    if (msg.branchId) {
      const key = `${msg.roomId}:${msg.branchId}`;
      branchUnread.set(key, (branchUnread.get(key) ?? 0) + 1);
    }

    const isMention = messageMentionsViewer({
      content: msg.content,
      metadata: msg.metadata,
      viewerUserId: userId,
      viewerMentionTokens,
    });
    if (!isMention) continue;

    roomMentions.set(msg.roomId, (roomMentions.get(msg.roomId) ?? 0) + 1);
    if (msg.branchId) {
      const key = `${msg.roomId}:${msg.branchId}`;
      branchMentions.set(key, (branchMentions.get(key) ?? 0) + 1);
    }
  }

  return rooms.map((room) => {
    const mentionUnreadCount = roomMentions.get(room.id) ?? 0;
    const branches: ChatBranchInfo[] | undefined = room.branches?.map((b) => {
      const branchMention = branchMentions.get(`${room.id}:${b.id}`) ?? 0;
      return {
        ...b,
        unreadCount: branchUnread.get(`${room.id}:${b.id}`) ?? 0,
        mentionUnreadCount: branchMention,
        hasMention: branchMention > 0,
      };
    });
    return {
      ...room,
      unreadCount: roomUnread.get(room.id) ?? 0,
      mentionUnreadCount,
      hasMention: mentionUnreadCount > 0,
      branches,
    };
  });
}

/** Latest message id at or before the member's read cursor (for unread divider). */
export async function resolveLastReadMessageId(
  roomId: string,
  userId: string,
  branchId?: string | null,
  opts?: { historySince?: Date | null }
): Promise<{ lastReadAt: string | null; lastReadMessageId: string | null }> {
  const membership = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: { lastReadAt: true, joinedAt: true },
  });

  if (!membership) {
    return { lastReadAt: null, lastReadMessageId: null };
  }

  const since = readSince(membership);
  // Never point the divider at a message the viewer cannot see (pre-join).
  const visibleFloor = opts?.historySince ?? null;
  const createdAtWhere =
    visibleFloor != null
      ? { lte: since, gte: visibleFloor }
      : { lte: since };

  const lastRead = await db.chatMessage.findFirst({
    where: {
      roomId,
      deletedAt: null,
      createdAt: createdAtWhere,
      ...(branchId ? { branchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return {
    lastReadAt: since.toISOString(),
    lastReadMessageId: lastRead?.id ?? null,
  };
}

/**
 * Advance the member's read cursor to now (or an explicit timestamp).
 * Creates nothing — caller must already be a ChatRoomMember.
 */
export async function markRoomAsRead(input: {
  roomId: string;
  userId: string;
  readAt?: Date;
}): Promise<{ lastReadAt: Date } | null> {
  const membership = await db.chatRoomMember.findUnique({
    where: {
      roomId_userId: { roomId: input.roomId, userId: input.userId },
    },
    select: { id: true },
  });
  if (!membership) return null;

  const lastReadAt = input.readAt ?? new Date();
  await db.chatRoomMember.update({
    where: { id: membership.id },
    data: { lastReadAt },
  });
  return { lastReadAt };
}
