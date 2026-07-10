import { ChatMemberRole, ChatRoomKind, ChatRoomTier, MessageType, UserRole } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify } from "@/lib/admin/server";

/** Legacy mega-group slug — deactivated in favor of per-mentor rooms. */
export const LEGACY_SHARED_COLLAB_SLUG = "mentor-admin-kolaborasi";

/** Prefix for per-mentor admin collab rooms: `mentor-admin-{mentorSlug}`. */
export const MENTOR_ADMIN_ROOM_SLUG_PREFIX = "mentor-admin";

export type MentorAdminChatSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tier: "Internal";
  isProtected: boolean;
  memberCount: number;
  mentorId: string;
  mentorName: string;
  lastMessage: {
    content: string;
    authorName: string;
    createdAt: string;
  } | null;
  href: string;
};

function roomSlugForMentor(mentorSlug: string) {
  return `${MENTOR_ADMIN_ROOM_SLUG_PREFIX}-${mentorSlug}`;
}

function roomNameForMentor(mentorName: string) {
  return `Admin · ${mentorName}`;
}

/**
 * Deactivate the old all-mentors+all-admins mega room if it still exists.
 */
export async function deactivateLegacySharedCollabRoom() {
  const legacy = await db.chatRoom.findMany({
    where: {
      isStaffCollaboration: true,
      OR: [
        { slug: LEGACY_SHARED_COLLAB_SLUG },
        { slug: { startsWith: `${LEGACY_SHARED_COLLAB_SLUG}-` } },
      ],
    },
    select: { id: true, slug: true, mentorId: true },
  });

  // Keep rooms that already match the per-mentor pattern `mentor-admin-{slug}`
  // where the suffix is a real mentor slug (handled by ensure). Only kill the
  // exact shared slug and accidental shared variants without a dedicated mentor owner pattern.
  const toDeactivate = legacy.filter((r) => r.slug === LEGACY_SHARED_COLLAB_SLUG);

  if (toDeactivate.length === 0) return;

  await db.chatRoom.updateMany({
    where: { id: { in: toDeactivate.map((r) => r.id) } },
    data: { isActive: false },
  });
}

/**
 * Ensures a private INTERNAL staff collaboration chat for one mentor ↔ admins.
 * Does not count toward mentor hub ownership limits (isStaffCollaboration=true).
 */
export async function ensureMentorAdminChatRoom(mentorProfileId: string) {
  const mentor = await db.mentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: { user: { select: { id: true, nama: true } } },
  });
  if (!mentor) {
    throw new Error("Mentor profile tidak ditemukan untuk ruang kolaborasi.");
  }

  const preferredSlug = roomSlugForMentor(mentor.slug);
  const preferredName = roomNameForMentor(mentor.user.nama);

  let room = await db.chatRoom.findFirst({
    where: {
      mentorId: mentor.id,
      isStaffCollaboration: true,
      roomKind: ChatRoomKind.MENTOR_INTERNAL,
      isActive: true,
    },
  });

  if (!room) {
    room = await db.chatRoom.findFirst({
      where: {
        slug: preferredSlug,
        isStaffCollaboration: true,
      },
    });
  }

  // Adopt a legacy INTERNAL room that used the per-mentor slug suffix.
  if (!room) {
    const legacy = await db.chatRoom.findFirst({
      where: {
        OR: [
          { slug: preferredSlug },
          { slug: `${LEGACY_SHARED_COLLAB_SLUG}-${mentor.slug}` },
        ],
        tier: ChatRoomTier.INTERNAL,
      },
    });
    if (legacy) {
      room = await db.chatRoom.update({
        where: { id: legacy.id },
        data: {
          mentorId: mentor.id,
          roomKind: ChatRoomKind.MENTOR_INTERNAL,
          isStaffCollaboration: true,
          isProtected: true,
          memberOnly: true,
          isActive: true,
          name: preferredName,
          slug: preferredSlug,
          description:
            "Ruang privat antara mentor ini dan admin untuk koordinasi kurikulum dan operasional.",
        },
      });
    }
  }

  if (!room) {
    const conflict = await db.chatRoom.findFirst({
      where: { mentorId: mentor.id, slug: preferredSlug },
    });

    room = await db.chatRoom.create({
      data: {
        mentorId: mentor.id,
        name: preferredName,
        slug: conflict ? slugify(`${preferredSlug}-${Date.now()}`) : preferredSlug,
        description:
          "Ruang privat antara mentor ini dan admin untuk koordinasi kurikulum dan operasional.",
        roomKind: ChatRoomKind.MENTOR_INTERNAL,
        tier: ChatRoomTier.INTERNAL,
        isProtected: true,
        screenshotProtection: true,
        memberOnly: true,
        isStaffCollaboration: true,
        isActive: true,
      },
    });

    await db.chatMessage.create({
      data: {
        roomId: room.id,
        userId: mentor.userId,
        content:
          "Selamat datang di ruang kolaborasi privat dengan admin. Gunakan ruang ini untuk diskusi usulan kurikulum dan koordinasi operasional.",
        messageType: MessageType.ANNOUNCEMENT,
        isPinned: true,
      },
    });
  } else {
    const needsFix =
      !room.isStaffCollaboration ||
      room.roomKind !== ChatRoomKind.MENTOR_INTERNAL ||
      !room.isActive ||
      room.mentorId !== mentor.id ||
      room.name === "Kolaborasi Mentor–Admin";

    if (needsFix) {
      room = await db.chatRoom.update({
        where: { id: room.id },
        data: {
          mentorId: mentor.id,
          roomKind: ChatRoomKind.MENTOR_INTERNAL,
          isStaffCollaboration: true,
          isProtected: true,
          memberOnly: true,
          isActive: true,
          name: preferredName,
          description:
            room.description ??
            "Ruang privat antara mentor ini dan admin untuk koordinasi kurikulum dan operasional.",
        },
      });
    }
  }

  await syncMentorAdminRoomMembers(room.id, mentor.userId);
  return room;
}

/**
 * Ensure every mentor has their own admin collab room; retire the shared mega room.
 */
export async function ensureAllMentorAdminChatRooms() {
  await deactivateLegacySharedCollabRoom();

  const mentors = await db.mentorProfile.findMany({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const rooms = [];
  for (const mentor of mentors) {
    rooms.push(await ensureMentorAdminChatRoom(mentor.id));
  }
  return rooms;
}

/**
 * Members = this mentor + all admins. Other mentors are removed (privacy).
 */
export async function syncMentorAdminRoomMembers(roomId: string, mentorUserId: string) {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  await db.chatRoomMember.upsert({
    where: { roomId_userId: { roomId, userId: mentorUserId } },
    create: { roomId, userId: mentorUserId, role: ChatMemberRole.MENTOR },
    update: { role: ChatMemberRole.MENTOR },
  });

  await Promise.all(
    admins.map((admin) =>
      db.chatRoomMember.upsert({
        where: { roomId_userId: { roomId, userId: admin.id } },
        create: { roomId, userId: admin.id, role: ChatMemberRole.MODERATOR },
        update: { role: ChatMemberRole.MODERATOR },
      })
    )
  );

  const allowedIds = new Set([mentorUserId, ...admins.map((a) => a.id)]);
  const extras = await db.chatRoomMember.findMany({
    where: { roomId, userId: { notIn: [...allowedIds] } },
    select: { id: true },
  });
  if (extras.length > 0) {
    await db.chatRoomMember.deleteMany({
      where: { id: { in: extras.map((e) => e.id) } },
    });
  }
}

/** @deprecated Use syncMentorAdminRoomMembers — kept for call-site compatibility during transition. */
export async function syncMentorAdminMembers(roomId: string) {
  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    select: { mentorId: true, mentor: { select: { userId: true } } },
  });
  if (!room?.mentor) return;
  await syncMentorAdminRoomMembers(roomId, room.mentor.userId);
}

async function toSummary(
  room: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isProtected: boolean;
    mentorId: string | null;
  },
  mentorName: string
): Promise<MentorAdminChatSummary> {
  const [memberCount, lastMessage] = await Promise.all([
    db.chatRoomMember.count({ where: { roomId: room.id } }),
    db.chatMessage.findFirst({
      where: { roomId: room.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { nama: true } } },
    }),
  ]);

  return {
    id: room.id,
    name: room.name,
    slug: room.slug,
    description: room.description,
    tier: "Internal",
    isProtected: room.isProtected,
    memberCount,
    mentorId: room.mentorId ?? "",
    mentorName,
    lastMessage: lastMessage
      ? {
          content: lastMessage.content,
          authorName: lastMessage.user.nama,
          createdAt: lastMessage.createdAt.toISOString(),
        }
      : null,
    href: `/mentor/chat`,
  };
}

export async function getMentorAdminChatRoomSummaryForMentor(mentorProfileId: string) {
  const mentor = await db.mentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: { user: { select: { nama: true } } },
  });
  if (!mentor) {
    throw new Error("Mentor profile tidak ditemukan.");
  }

  await deactivateLegacySharedCollabRoom();
  const room = await ensureMentorAdminChatRoom(mentorProfileId);
  return toSummary(room, mentor.user.nama);
}

export async function listMentorAdminChatRoomSummaries() {
  await ensureAllMentorAdminChatRooms();

  const rooms = await db.chatRoom.findMany({
    where: {
      isStaffCollaboration: true,
      roomKind: ChatRoomKind.MENTOR_INTERNAL,
      isActive: true,
      mentorId: { not: null },
    },
    include: {
      mentor: { include: { user: { select: { nama: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    rooms.map((room) => toSummary(room, room.mentor?.user.nama ?? "Mentor"))
  );
}

/** @deprecated Prefer getMentorAdminChatRoomSummaryForMentor */
export async function getMentorAdminChatRoomSummary() {
  const first = await db.mentorProfile.findFirst({ orderBy: { createdAt: "asc" } });
  if (!first) throw new Error("Belum ada mentor profile.");
  return getMentorAdminChatRoomSummaryForMentor(first.id);
}
