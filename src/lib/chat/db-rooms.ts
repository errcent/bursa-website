import {
  ChatMemberRole,
  ChatRoomKind,
  ChatRoomTier,
  MessageType,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  branchModeToUi,
  branchVisibilityToUi,
  pickDefaultBranchId,
  roomKindToUi,
  senderPolicyToUi,
} from "@/lib/chat/room-kinds";
import type {
  ChannelCategory,
  ChatBranchInfo,
  ChatRoom,
  RoomTier,
} from "@/lib/chat/types";
import { attachUnreadCounts } from "@/lib/chat/unread";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

type DbRoom = Prisma.ChatRoomGetPayload<{
  include: {
    mentor: {
      include: { user: true };
    };
    branches: true;
    _count: { select: { members: true } };
  };
}>;

function tierToChannel(
  roomKind: ChatRoomKind,
  tier: ChatRoomTier
): {
  channelCategory: ChannelCategory;
  tier?: RoomTier;
} {
  if (roomKind === ChatRoomKind.PUBLIC) {
    return { channelCategory: "Publik" };
  }
  // Staff collab / legacy internal rooms
  if (roomKind === ChatRoomKind.MENTOR_INTERNAL || tier === ChatRoomTier.INTERNAL) {
    return { channelCategory: "Internal" };
  }
  const map: Record<Exclude<ChatRoomTier, "INTERNAL">, RoomTier> = {
    PEMULA: "Pemula",
    MENENGAH: "Menengah",
    MAHIR: "Mahir",
  };
  return { channelCategory: "Komunitas", tier: map[tier as Exclude<ChatRoomTier, "INTERNAL">] };
}

function mapBranches(
  branches: DbRoom["branches"] | undefined
): ChatBranchInfo[] | undefined {
  if (!branches?.length) return undefined;
  return [...branches]
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description ?? undefined,
      mode: branchModeToUi(b.mode),
      senderPolicy: senderPolicyToUi(b.senderPolicy),
      visibility: branchVisibilityToUi(b.visibility),
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    }));
}

export function mapDbRoomToChatRoom(room: DbRoom): ChatRoom {
  const { channelCategory, tier } = tierToChannel(room.roomKind, room.tier);
  const mentor = room.mentor;
  const initials = mentor
    ? mentor.initials ||
      mentor.user.nama
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PP";

  const memberCount = room._count?.members ?? 0;
  return {
    id: room.id,
    slug: room.slug,
    name: room.name,
    description: room.description ?? "",
    channelCategory,
    roomKind: roomKindToUi(room.roomKind),
    tier,
    isProtected: room.isProtected,
    unreadCount: 0,
    mentionUnreadCount: 0,
    hasMention: false,
    onlineCount: Number.isFinite(memberCount) ? memberCount : 0,
    mentorId: mentor?.id,
    mentorSlug: mentor?.slug ?? "platform",
    mentorName: mentor?.user.nama ?? "Platform",
    mentorInitials: initials,
    mentorAvatarUrl: mentor?.avatarUrl ?? undefined,
    isLive: room.isLive,
    liveStartedAt: room.liveStartedAt?.toISOString(),
    liveTitle: room.liveTitle ?? undefined,
    branches: mapBranches(room.branches),
  };
}

const roomInclude = {
  mentor: { include: { user: true } },
  branches: { orderBy: { sortOrder: "asc" as const } },
  _count: { select: { members: true } },
} as const;

export async function findChatRoomBySlug(
  slug: string,
  mentorId?: string | null
): Promise<ChatRoom | null> {
  const room = await db.chatRoom.findFirst({
    where: {
      slug,
      ...(mentorId ? { mentorId } : {}),
      isActive: true,
    },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });

  if (!room) return null;
  return mapDbRoomToChatRoom(room);
}

export async function listActiveChatRooms(): Promise<ChatRoom[]> {
  const rooms = await db.chatRoom.findMany({
    where: {
      isActive: true,
      isStaffCollaboration: false,
    },
    include: roomInclude,
    orderBy: [{ roomKind: "asc" }, { createdAt: "asc" }],
  });
  return rooms.map(mapDbRoomToChatRoom);
}

export async function listPublicChatRooms(): Promise<ChatRoom[]> {
  const rooms = await db.chatRoom.findMany({
    where: { isActive: true, roomKind: ChatRoomKind.PUBLIC },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });
  return rooms.map(mapDbRoomToChatRoom);
}

/** Mentor hubs the signed-in mentor owns (max 1) — excludes staff collab. */
export async function listMentorOwnedRooms(mentorProfileId: string): Promise<ChatRoom[]> {
  const rooms = await db.chatRoom.findMany({
    where: {
      mentorId: mentorProfileId,
      isActive: true,
      isStaffCollaboration: false,
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
    },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });
  return rooms.map(mapDbRoomToChatRoom);
}

/**
 * Rooms a mentor may open in /mentor/chat: hubs they own, or hubs where they
 * are a MODERATOR member. Staff collab is separate.
 */
export async function listMentorAccessibleHubs(input: {
  mentorProfileId: string;
  userId: string;
}): Promise<ChatRoom[]> {
  const rooms = await db.chatRoom.findMany({
    where: {
      isActive: true,
      isStaffCollaboration: false,
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
      OR: [
        { mentorId: input.mentorProfileId },
        {
          members: {
            some: {
              userId: input.userId,
              role: { in: ["MENTOR", "MODERATOR"] },
            },
          },
        },
      ],
    },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });
  return rooms.map(mapDbRoomToChatRoom);
}

/** Enforce at most 1 mentor hub per mentor (excluding staff collab). */
export async function assertMentorRoomSlotAvailable(
  mentorProfileId: string,
  roomKind: ChatRoomKind
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (roomKind !== ChatRoomKind.MENTOR_COMMUNITY) {
    return { ok: true };
  }

  const existing = await db.chatRoom.count({
    where: {
      mentorId: mentorProfileId,
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
      isStaffCollaboration: false,
      isActive: true,
    },
  });

  if (existing >= 1) {
    return {
      ok: false,
      error: "Mentor sudah memiliki 1 grup hub. Maksimal 1 grup per mentor.",
    };
  }
  return { ok: true };
}

export type ChatRoomViewer = {
  id: string;
  role: UserRole;
  mentorProfileId?: string | null;
};

/** Mentor hubs where the user is a ChatRoomMember (subscribed). */
export async function listLearnerSubscribedHubs(userId: string): Promise<ChatRoom[]> {
  const rooms = await db.chatRoom.findMany({
    where: {
      isActive: true,
      isStaffCollaboration: false,
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
      members: { some: { userId } },
    },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });
  return rooms.map(mapDbRoomToChatRoom);
}

function sortRoomsForViewer(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.channelCategory === "Publik" && b.channelCategory !== "Publik") return -1;
    if (b.channelCategory === "Publik" && a.channelCategory !== "Publik") return 1;
    return a.name.localeCompare(b.name, "id");
  });
}

/**
 * Rooms visible in komunitas / chat sidebars for the signed-in viewer.
 * - Mentors: PUBLIC + hubs they own or moderate
 * - Learners: PUBLIC + mentor hubs they are members of (subscribed)
 * - Admins/developers (and anonymous SSR fallback): all active non-staff rooms
 */
export async function listChatRoomsForViewer(
  viewer: ChatRoomViewer | null | undefined
): Promise<ChatRoom[]> {
  if (!viewer) {
    return listActiveChatRooms();
  }

  let rooms: ChatRoom[];

  if (viewer.role === UserRole.MENTOR && viewer.mentorProfileId) {
    const [publicRooms, hubs] = await Promise.all([
      listPublicChatRooms(),
      listMentorAccessibleHubs({
        mentorProfileId: viewer.mentorProfileId,
        userId: viewer.id,
      }),
    ]);
    const byId = new Map<string, ChatRoom>();
    for (const room of [...publicRooms, ...hubs]) {
      byId.set(room.id, room);
    }
    rooms = sortRoomsForViewer([...byId.values()]);
  } else if (viewer.role === UserRole.LEARNER) {
    const [publicRooms, hubs] = await Promise.all([
      listPublicChatRooms(),
      listLearnerSubscribedHubs(viewer.id),
    ]);
    const byId = new Map<string, ChatRoom>();
    for (const room of [...publicRooms, ...hubs]) {
      byId.set(room.id, room);
    }
    rooms = sortRoomsForViewer([...byId.values()]);
  } else {
    rooms = await listActiveChatRooms();
  }

  return attachUnreadCounts(rooms, viewer.id);
}

/** Ensure the mentor profile owner is a MENTOR ChatRoomMember of their hub. */
export async function ensureMentorOwnerMembership(input: {
  roomId: string;
  mentorProfileId: string;
}): Promise<void> {
  const profile = await db.mentorProfile.findUnique({
    where: { id: input.mentorProfileId },
    select: { userId: true },
  });
  if (!profile) return;

  await db.chatRoomMember.upsert({
    where: {
      roomId_userId: { roomId: input.roomId, userId: profile.userId },
    },
    create: {
      roomId: input.roomId,
      userId: profile.userId,
      role: ChatMemberRole.MENTOR,
    },
    update: { role: ChatMemberRole.MENTOR },
  });
}

/**
 * Post a centered SYSTEM notice when someone newly joins via subscription/enroll.
 * Mentor hubs → default public 2-way branch (Diskusi); public rooms → room-level.
 */
export async function postSubscriptionJoinSystemMessage(input: {
  roomId: string;
  userId: string;
  roomKind: ChatRoomKind;
  isStaffCollaboration?: boolean;
}): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { nama: true },
  });
  const displayName = user?.nama?.trim() || "Seseorang";
  const content = `${displayName} bergabung ke grup karena berlangganan`;

  let branchId: string | null = null;
  if (
    input.roomKind === ChatRoomKind.MENTOR_COMMUNITY &&
    !input.isStaffCollaboration
  ) {
    const branches = await db.chatBranch.findMany({
      where: { roomId: input.roomId, isActive: true },
      select: { id: true, mode: true, visibility: true },
      orderBy: { sortOrder: "asc" },
    });
    branchId = pickDefaultBranchId(
      branches.map((b) => ({
        id: b.id,
        mode: b.mode,
        visibility: branchVisibilityToUi(b.visibility),
      })),
      { preferTwoWay: true }
    );
  }

  await db.chatMessage.create({
    data: {
      roomId: input.roomId,
      branchId,
      userId: input.userId,
      content,
      messageType: MessageType.SYSTEM,
      metadata: {
        kind: "member_joined",
        reason: "subscription",
      },
    },
  });
}

/**
 * After course enrollment, add the learner to that mentor's community hub (if any).
 * Idempotent — safe to call on every enrollment. Posts a join notice only on first join.
 * Uses upsert so a missed membership is always repaired even if createMany is a no-op.
 */
export async function ensureHubMembershipForCourseEnrollment(input: {
  userId: string;
  courseId: string;
}): Promise<{ roomId: string; joined: boolean } | null> {
  const course = await db.course.findUnique({
    where: { id: input.courseId },
    select: { mentorId: true },
  });
  if (!course?.mentorId) return null;

  const hub = await db.chatRoom.findFirst({
    where: {
      mentorId: course.mentorId,
      roomKind: ChatRoomKind.MENTOR_COMMUNITY,
      isStaffCollaboration: false,
      isActive: true,
    },
    select: { id: true, roomKind: true, isStaffCollaboration: true },
    orderBy: { createdAt: "asc" },
  });
  if (!hub) return null;

  const existing = await db.chatRoomMember.findUnique({
    where: {
      roomId_userId: { roomId: hub.id, userId: input.userId },
    },
    select: { id: true },
  });
  if (existing) {
    return { roomId: hub.id, joined: false };
  }

  try {
    await db.chatRoomMember.create({
      data: {
        roomId: hub.id,
        userId: input.userId,
        role: ChatMemberRole.MEMBER,
      },
    });
  } catch {
    // Concurrent heal/enroll — membership already exists.
    return { roomId: hub.id, joined: false };
  }

  await postSubscriptionJoinSystemMessage({
    roomId: hub.id,
    userId: input.userId,
    roomKind: hub.roomKind,
    isStaffCollaboration: hub.isStaffCollaboration,
  });

  return { roomId: hub.id, joined: true };
}

/**
 * Heal: for every course Enrollment the user has, ensure ChatRoomMember on that
 * mentor's hub. Used when opening komunitas / learning so older broken subs
 * (enrollment without hub) recover without re-checkout.
 */
export async function healHubMembershipsForUserEnrollments(
  userId: string
): Promise<{ healed: number; hubs: string[] }> {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const hubs: string[] = [];
  let healed = 0;
  for (const enrollment of enrollments) {
    const result = await ensureHubMembershipForCourseEnrollment({
      userId,
      courseId: enrollment.courseId,
    });
    if (result?.joined) {
      healed += 1;
      hubs.push(result.roomId);
    } else if (result?.roomId && !hubs.includes(result.roomId)) {
      hubs.push(result.roomId);
    }
  }
  return { healed, hubs };
}

/**
 * One-shot / admin: every Enrollment missing mentor-hub membership gets fixed.
 */
export async function healAllMissingHubMembershipsFromEnrollments(): Promise<{
  checked: number;
  joined: number;
}> {
  const enrollments = await db.enrollment.findMany({
    select: { userId: true, courseId: true },
  });
  let joined = 0;
  for (const enrollment of enrollments) {
    const result = await ensureHubMembershipForCourseEnrollment({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
    });
    if (result?.joined) joined += 1;
  }
  return { checked: enrollments.length, joined };
}

/**
 * Join a mentor hub when the learner is enrolled in any course by that mentor.
 */
export async function joinMentorHubIfEligible(input: {
  userId: string;
  roomId: string;
}): Promise<
  | { ok: true; roomId: string }
  | { ok: false; status: number; error: string }
> {
  const room = await db.chatRoom.findUnique({
    where: { id: input.roomId },
    select: {
      id: true,
      roomKind: true,
      mentorId: true,
      isActive: true,
      isStaffCollaboration: true,
    },
  });

  if (!room || !room.isActive) {
    return { ok: false, status: 404, error: "Chat room not found" };
  }

  if (room.roomKind === ChatRoomKind.PUBLIC) {
    await db.chatRoomMember.upsert({
      where: {
        roomId_userId: { roomId: room.id, userId: input.userId },
      },
      create: {
        roomId: room.id,
        userId: input.userId,
        role: ChatMemberRole.MEMBER,
      },
      update: {},
    });
    return { ok: true, roomId: room.id };
  }

  if (
    room.roomKind !== ChatRoomKind.MENTOR_COMMUNITY ||
    room.isStaffCollaboration ||
    !room.mentorId
  ) {
    return { ok: false, status: 403, error: "Ruang ini tidak dapat digabung." };
  }

  // Also ensure hub owner membership when any eligible user joins (heals missing/wrong role).
  if (room.mentorId) {
    await ensureMentorOwnerMembership({
      roomId: room.id,
      mentorProfileId: room.mentorId,
    });
  }

  const existing = await db.chatRoomMember.findUnique({
    where: {
      roomId_userId: { roomId: room.id, userId: input.userId },
    },
  });

  // Hub owner is always a MENTOR member (even without a learner enrollment).
  const owner = await isHubOwner(input.userId, room.mentorId);
  if (existing) {
    if (owner && existing.role !== ChatMemberRole.MENTOR) {
      await db.chatRoomMember.update({
        where: { id: existing.id },
        data: { role: ChatMemberRole.MENTOR },
      });
    }
    return { ok: true, roomId: room.id };
  }

  if (owner) {
    await db.chatRoomMember.create({
      data: {
        roomId: room.id,
        userId: input.userId,
        role: ChatMemberRole.MENTOR,
      },
    });
    return { ok: true, roomId: room.id };
  }

  const enrolled = await db.enrollment.findFirst({
    where: {
      userId: input.userId,
      course: { mentorId: room.mentorId },
    },
    select: { id: true },
  });

  if (!enrolled) {
    return {
      ok: false,
      status: 403,
      error:
        "Bergabung ke hub mentor memerlukan enrollment kelas dari mentor tersebut.",
    };
  }

  await db.chatRoomMember.create({
    data: {
      roomId: room.id,
      userId: input.userId,
      role: ChatMemberRole.MEMBER,
    },
  });

  await postSubscriptionJoinSystemMessage({
    roomId: room.id,
    userId: input.userId,
    roomKind: room.roomKind,
    isStaffCollaboration: room.isStaffCollaboration,
  });

  return { ok: true, roomId: room.id };
}

async function isHubOwner(userId: string, mentorId: string | null | undefined) {
  if (!mentorId) return false;
  const profile = await db.mentorProfile.findUnique({
    where: { id: mentorId },
    select: { userId: true },
  });
  return profile?.userId === userId;
}

/**
 * Whether the viewer may open a chat room (list detail / messages / URL).
 * Mentors cannot open another mentor's hub unless they are a member/moderator/owner.
 */
export async function assertCanAccessChatRoom(input: {
  room: {
    id: string;
    roomKind: ChatRoomKind;
    mentorId: string | null;
    isStaffCollaboration: boolean;
    isProtected: boolean;
    isActive: boolean;
  };
  viewer: ChatRoomViewer | null | undefined;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { room, viewer } = input;

  if (!room.isActive) {
    return { ok: false, status: 404, error: "Chat room not found" };
  }

  if (room.roomKind === ChatRoomKind.PUBLIC) {
    return { ok: true };
  }

  if (room.isStaffCollaboration || room.roomKind === ChatRoomKind.MENTOR_INTERNAL) {
    if (!viewer) {
      return { ok: false, status: 401, error: "Autentikasi diperlukan." };
    }
    if (viewer.role === UserRole.DEVELOPER) {
      return {
        ok: false,
        status: 403,
        error: "Developer tidak dapat mengakses chat privat mentor–admin.",
      };
    }
    // Admins can open any per-mentor collab thread.
    if (viewer.role === UserRole.ADMIN) {
      return { ok: true };
    }
    // Mentors only see their own thread (must be a room member).
    if (viewer.role === UserRole.MENTOR) {
      const membership = await db.chatRoomMember.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: viewer.id } },
      });
      if (membership) return { ok: true };
      return {
        ok: false,
        status: 403,
        error: "Anda tidak memiliki akses ke ruang kolaborasi mentor lain.",
      };
    }
    return { ok: false, status: 403, error: "Akses ditolak." };
  }

  // Mentor community hubs
  if (!viewer) {
    return { ok: false, status: 401, error: "Autentikasi diperlukan." };
  }

  if (viewer.role === UserRole.ADMIN) {
    return { ok: true };
  }

  if (viewer.role === UserRole.DEVELOPER) {
    return { ok: true };
  }

  const owner = await isHubOwner(viewer.id, room.mentorId);
  if (owner) return { ok: true };

  const membership = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: viewer.id } },
  });

  if (membership) return { ok: true };

  // Mentors must not open other mentors' private hubs by URL.
  if (viewer.role === UserRole.MENTOR) {
    return {
      ok: false,
      status: 403,
      error: "Anda tidak memiliki akses ke hub mentor lain.",
    };
  }

  // Learners may only open hubs they have subscribed to (ChatRoomMember).
  if (viewer.role === UserRole.LEARNER) {
    return {
      ok: false,
      status: 403,
      error:
        "Anda belum bergabung di hub ini. Enroll kelas mentor untuk berlangganan ruang chat.",
    };
  }

  return { ok: false, status: 403, error: "Akses ditolak." };
}

/**
 * Resolve a chat viewer from the client-auth email header.
 * Client-auth users live in localStorage and may not have a Prisma row yet —
 * pass createIfMissing so new registrants can join/read/send without a heal script.
 */
export async function resolveChatRoomViewerFromEmail(
  email: string | null | undefined,
  options?: {
    createIfMissing?: boolean;
    userId?: string | null;
    name?: string | null;
    role?: string | null;
  }
): Promise<ChatRoomViewer | null> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized && !options?.userId?.trim()) return null;

  const createIfMissing = options?.createIfMissing ?? false;
  const user = await resolveRequestUser(
    {
      userId: options?.userId?.trim() || normalized || "",
      email: normalized || undefined,
      name: options?.name?.trim() || undefined,
      role: options?.role || undefined,
    },
    { createIfMissing }
  );
  if (!user) return null;

  const mentorProfile = await db.mentorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return {
    id: user.id,
    role: user.role,
    mentorProfileId: mentorProfile?.id ?? null,
  };
}

/** True when a mentor may manage/list a hub (owner or MENTOR/MODERATOR member). */
export function mentorCanManageHub(input: {
  mentorProfileId: string;
  roomMentorId: string | null | undefined;
  membershipRole?: ChatMemberRole | null;
}): boolean {
  if (input.roomMentorId && input.roomMentorId === input.mentorProfileId) {
    return true;
  }
  return (
    input.membershipRole === ChatMemberRole.MENTOR ||
    input.membershipRole === ChatMemberRole.MODERATOR
  );
}
