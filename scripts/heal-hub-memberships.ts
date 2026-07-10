/**
 * One-shot: create ChatRoomMember on each mentor hub for every Enrollment
 * that is missing membership (e.g. gorbon/tw after public-only join).
 *
 * Usage from Website/: npx tsx scripts/heal-hub-memberships.ts
 */
import {
  ChatMemberRole,
  ChatRoomKind,
  MessageType,
  PrismaClient,
} from "@prisma/client";

const db = new PrismaClient();

async function ensureHubMembership(userId: string, courseId: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
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
    where: { roomId_userId: { roomId: hub.id, userId } },
    select: { id: true },
  });
  if (existing) return { roomId: hub.id, joined: false };

  await db.chatRoomMember.create({
    data: {
      roomId: hub.id,
      userId,
      role: ChatMemberRole.MEMBER,
    },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true },
  });
  const displayName = user?.nama?.trim() || "Seseorang";

  let branchId: string | null = null;
  if (!hub.isStaffCollaboration) {
    const discussion = await db.chatBranch.findFirst({
      where: {
        roomId: hub.id,
        isActive: true,
        visibility: "PUBLIC",
        mode: "TWO_WAY",
      },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    branchId =
      discussion?.id ??
      (
        await db.chatBranch.findFirst({
          where: { roomId: hub.id, isActive: true, visibility: "PUBLIC" },
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        })
      )?.id ??
      null;
  }

  await db.chatMessage.create({
    data: {
      roomId: hub.id,
      branchId,
      userId,
      content: `${displayName} bergabung ke grup karena berlangganan`,
      messageType: MessageType.SYSTEM,
      metadata: { kind: "member_joined", reason: "subscription" },
    },
  });

  return { roomId: hub.id, joined: true };
}

async function main() {
  const enrollments = await db.enrollment.findMany({
    select: { userId: true, courseId: true },
  });
  let joined = 0;
  for (const e of enrollments) {
    const result = await ensureHubMembership(e.userId, e.courseId);
    if (result?.joined) joined += 1;
  }
  console.log("HEAL_RESULT", { checked: enrollments.length, joined });

  const targets = await db.user.findMany({
    where: {
      OR: [
        { email: { contains: "gorbon" } },
        { nama: { contains: "gorbon" } },
        { email: { equals: "tw@gmail.com" } },
        { nama: { equals: "tw" } },
      ],
    },
    select: { id: true, email: true, nama: true },
  });

  const melati = await db.mentorProfile.findFirst({
    where: { slug: "melati-putri" },
    select: { id: true },
  });
  const hub = melati
    ? await db.chatRoom.findFirst({
        where: {
          mentorId: melati.id,
          roomKind: ChatRoomKind.MENTOR_COMMUNITY,
          isStaffCollaboration: false,
          isActive: true,
        },
        select: { id: true, slug: true, name: true },
      })
    : null;

  console.log("MELATI_HUB", hub);

  for (const user of targets) {
    const member = hub
      ? await db.chatRoomMember.findUnique({
          where: { roomId_userId: { roomId: hub.id, userId: user.id } },
        })
      : null;
    const rooms = await db.chatRoomMember.findMany({
      where: { userId: user.id },
      include: { room: { select: { slug: true, roomKind: true } } },
    });
    console.log("VERIFY", {
      email: user.email,
      nama: user.nama,
      melatiHubMember: Boolean(member),
      memberships: rooms.map((r) => ({
        slug: r.room.slug,
        kind: r.room.roomKind,
      })),
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
