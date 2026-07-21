import {
  ChatRoomTier,
  CourseLevel,
  Instrument,
  ModerationStatus,
  UserRole,
  VerificationStatus,
  type Prisma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import { instrumentToUi, levelToUi } from "@/lib/catalog/enums";
import { db } from "@/lib/db";
import {
  PLATFORM_COMMISSION_RATE,
  calculateCheckoutBreakdown,
} from "@/lib/pricing";
import type {
  AdminChatRoom,
  AdminCourse,
  AdminMentor,
  AdminModerationItem,
  AdminRevenueByCourse,
  AdminRevenueByMentor,
  AdminRevenueLine,
  AdminRevenueReport,
  AdminStats,
  AdminUser,
  ChatRoomTierLabel,
} from "./types";
import type { Instrument as UiInstrument, Level } from "@/lib/types";

/** Admin or developer (QC read-only panel access). */
export async function requireAdminPanel(request: Request) {
  const email = await resolveTrustedEmail(request);
  if (!email) return null;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.DEVELOPER) return null;
  return user;
}

/** Admin only — use for mutations. Developers must not mutate via admin API. */
export async function requireAdmin(request: Request) {
  const user = await requireAdminPanel(request);
  if (!user || user.role !== UserRole.ADMIN) return null;
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 401 });
}

export function forbidden(message = "Akses ditolak.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export {
  instrumentFromUi,
  instrumentToUi,
  levelFromUi,
  levelToUi,
  tierFromUi,
  tierToUi,
} from "@/lib/catalog/enums";

export function roleToUi(role: UserRole): AdminUser["role"] {
  const map: Record<UserRole, AdminUser["role"]> = {
    LEARNER: "learner",
    MENTOR: "mentor",
    ADMIN: "admin",
    DEVELOPER: "developer",
  };
  return map[role];
}

export function roleFromUi(role: AdminUser["role"]): UserRole {
  const map: Record<AdminUser["role"], UserRole> = {
    learner: UserRole.LEARNER,
    mentor: UserRole.MENTOR,
    admin: UserRole.ADMIN,
    developer: UserRole.DEVELOPER,
  };
  return map[role];
}

export function mapMentor(
  profile: Prisma.MentorProfileGetPayload<{ include: { user: true } }>
): AdminMentor {
  return {
    id: profile.id,
    userId: profile.userId,
    slug: profile.slug,
    name: profile.user.nama,
    email: profile.user.email,
    title: profile.title,
    bio: profile.bio,
    philosophy: profile.philosophy,
    instruments: (profile.instruments as UiInstrument[]) ?? [],
    verified: profile.verificationStatus === VerificationStatus.VERIFIED,
    yearsExperience: profile.yearsExperience,
    studentsCount: profile.studentsCount,
    coursesCount: profile.coursesCount,
    rating: profile.rating,
    licenseLabel: profile.licenseLabel ?? undefined,
    availableFor1on1: profile.availableFor1on1,
    sessionPrice: profile.sessionPrice ?? undefined,
  };
}

export function mapCourse(
  course: Prisma.CourseGetPayload<{
    include: { mentor: { include: { user: true } }; modules: { include: { lessons: true } } };
  }>
): AdminCourse {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    mentorId: course.mentorId,
    mentorName: course.mentor.user.nama,
    instrument: instrumentToUi(course.instrument),
    level: levelToUi(course.level),
    price: course.price,
    studentsCount: course.studentsCount,
    durationHours: course.durationHours,
    shortDescription: course.shortDescription,
    thumbnailUrl: course.thumbnailUrl ?? undefined,
    isPublished: course.isPublished,
    modules: course.modules
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((mod) => ({
        id: mod.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
        lessons: mod.lessons
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            durationMinutes: lesson.durationMinutes,
            isPreviewGratis: lesson.isPreviewGratis,
            videoUrl: lesson.videoUrl,
            sortOrder: lesson.sortOrder,
          })),
      })),
  };
}

export function mapChatRoom(
  room: Prisma.ChatRoomGetPayload<{
    include: {
      mentor: { include: { user: true } };
      _count: { select: { members: true } };
    };
  }> & { branches?: { id: string }[] }
): AdminChatRoom {
  return {
    id: room.id,
    name: room.name,
    slug: room.slug,
    mentorId: room.mentorId ?? "",
    mentorName: room.mentor?.user.nama ?? "Platform (Publik)",
    tier: tierToUi(room.tier),
    roomKind:
      room.roomKind === "PUBLIC"
        ? "public"
        : room.roomKind === "MENTOR_INTERNAL"
          ? "mentor_internal"
          : "mentor_community",
    isProtected: room.isProtected,
    screenshotProtection: room.screenshotProtection,
    isActive: room.isActive,
    memberCount: room._count.members,
    description: room.description ?? undefined,
    branchCount: Array.isArray(room.branches) ? room.branches.length : undefined,
  };
}

function aggregateRevenueLines(lines: AdminRevenueLine[]): {
  byMentor: AdminRevenueByMentor[];
  byCourse: AdminRevenueByCourse[];
  totals: AdminRevenueReport["totals"];
} {
  const mentorMap = new Map<string, AdminRevenueByMentor>();
  const courseMap = new Map<string, AdminRevenueByCourse>();
  let gross = 0;
  let platformFee = 0;
  let mentorPayout = 0;

  for (const line of lines) {
    gross += line.coursePrice;
    platformFee += line.platformFee;
    mentorPayout += line.mentorPayout;

    const mentor = mentorMap.get(line.mentorId) ?? {
      mentorId: line.mentorId,
      mentorName: line.mentorName,
      transactionCount: 0,
      gross: 0,
      platformFee: 0,
      mentorPayout: 0,
    };
    mentor.transactionCount += 1;
    mentor.gross += line.coursePrice;
    mentor.platformFee += line.platformFee;
    mentor.mentorPayout += line.mentorPayout;
    mentorMap.set(line.mentorId, mentor);

    const course = courseMap.get(line.courseId) ?? {
      courseId: line.courseId,
      courseTitle: line.courseTitle,
      mentorName: line.mentorName,
      transactionCount: 0,
      gross: 0,
      platformFee: 0,
      mentorPayout: 0,
    };
    course.transactionCount += 1;
    course.gross += line.coursePrice;
    course.platformFee += line.platformFee;
    course.mentorPayout += line.mentorPayout;
    courseMap.set(line.courseId, course);
  }

  return {
    totals: {
      transactionCount: lines.length,
      gross,
      platformFee,
      mentorPayout,
    },
    byMentor: [...mentorMap.values()].sort((a, b) => b.platformFee - a.platformFee),
    byCourse: [...courseMap.values()].sort((a, b) => b.platformFee - a.platformFee),
  };
}

export async function buildRevenueReport(): Promise<AdminRevenueReport> {
  const commissionRatePercent = PLATFORM_COMMISSION_RATE * 100;

  const transactions = await db.transaction.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, nama: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          mentorId: true,
          mentor: { select: { id: true, user: { select: { nama: true } } } },
        },
      },
      // Session payments (kind=SESSION) attribute revenue via the mentor, not a course (QC-20260719-47).
      mentor: { select: { id: true, user: { select: { nama: true } } } },
    },
  });

  if (transactions.length > 0) {
    const lines: AdminRevenueLine[] = transactions.map((tx) => {
      const breakdown = calculateCheckoutBreakdown(tx.amount);
      const mentorId = tx.course?.mentor.id ?? tx.mentor?.id ?? "unknown";
      const mentorName = tx.course?.mentor.user.nama ?? tx.mentor?.user.nama ?? "—";
      return {
        id: tx.id,
        source: "transaction",
        status: "COMPLETED",
        // Session rows share a synthetic bucket so the by-course view stays coherent.
        courseId: tx.course?.id ?? `session:${mentorId}`,
        courseTitle: tx.course?.title ?? "Sesi 1-on-1",
        mentorId,
        mentorName,
        buyerId: tx.user.id,
        buyerName: tx.user.nama,
        buyerEmail: tx.user.email,
        coursePrice: breakdown.coursePrice,
        platformFee: breakdown.platformFee,
        mentorPayout: breakdown.mentorPayout,
        commissionRatePercent: breakdown.commissionRatePercent,
        createdAt: tx.createdAt.toISOString(),
      };
    });

    const { totals, byMentor, byCourse } = aggregateRevenueLines(lines);

    return {
      commissionRatePercent,
      dataSource: "transaction",
      note: `Berdasarkan transaksi selesai di database. Komisi platform ${commissionRatePercent}%.`,
      totals,
      lines,
      byMentor,
      byCourse,
    };
  }

  const enrollments = await db.enrollment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, nama: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          mentor: { select: { id: true, user: { select: { nama: true } } } },
        },
      },
    },
  });

  const lines: AdminRevenueLine[] = enrollments.map((enrollment) => {
    const breakdown = calculateCheckoutBreakdown(enrollment.course.price);
    return {
      id: `enroll-${enrollment.id}`,
      source: "enrollment_estimate",
      status: "ESTIMATED",
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      mentorId: enrollment.course.mentor.id,
      mentorName: enrollment.course.mentor.user.nama,
      buyerId: enrollment.user.id,
      buyerName: enrollment.user.nama,
      buyerEmail: enrollment.user.email,
      coursePrice: breakdown.coursePrice,
      platformFee: breakdown.platformFee,
      mentorPayout: breakdown.mentorPayout,
      commissionRatePercent: breakdown.commissionRatePercent,
      createdAt: enrollment.createdAt.toISOString(),
    };
  });

  const { totals, byMentor, byCourse } = aggregateRevenueLines(lines);

  return {
    commissionRatePercent,
    dataSource: "enrollment_estimate",
    note: `Belum ada transaksi tersimpan. Angka diestimasi dari enrollment × harga kelas saat ini, komisi platform ${commissionRatePercent}%.`,
    totals,
    lines,
    byMentor,
    byCourse,
  };
}

export async function buildStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalMentors,
    totalCourses,
    totalEnrollments,
    completedTransactions,
    activeChatRooms,
    pendingModeration,
    recentEnrollments,
    recentModeration,
    recentAudit,
  ] = await Promise.all([
    db.user.count(),
    db.mentorProfile.count(),
    db.course.count(),
    db.enrollment.count(),
    db.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true },
    }),
    db.chatRoom.count({ where: { isActive: true } }),
    db.contentModerationQueue.count({ where: { status: ModerationStatus.PENDING } }),
    db.enrollment.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { user: true, course: true },
    }),
    db.contentModerationQueue.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      where: { status: ModerationStatus.PENDING },
    }),
    db.adminAuditLog.findMany({
      take: 2,
      orderBy: { createdAt: "desc" },
      include: { admin: true },
    }),
  ]);

  let revenue = completedTransactions.reduce(
    (sum, tx) => sum + calculateCheckoutBreakdown(tx.amount).platformFee,
    0
  );

  if (completedTransactions.length === 0) {
    const enrollments = await db.enrollment.findMany({
      include: { course: { select: { price: true } } },
    });
    revenue = enrollments.reduce(
      (sum, e) => sum + calculateCheckoutBreakdown(e.course.price).platformFee,
      0
    );
  }

  const recentActivity = [
    ...recentEnrollments.map((e) => ({
      id: `enroll-${e.id}`,
      type: "enrollment",
      description: `${e.user.nama} mendaftar ${e.course.title}`,
      actor: e.user.email,
      createdAt: e.createdAt.toISOString(),
    })),
    ...recentModeration.map((m) => ({
      id: `mod-${m.id}`,
      type: "moderation",
      description: `Laporan ${m.contentType} menunggu review`,
      createdAt: m.createdAt.toISOString(),
    })),
    ...recentAudit.map((a) => ({
      id: `audit-${a.id}`,
      type: "admin",
      description: `${a.action} pada ${a.entityType}`,
      actor: a.admin.nama,
      createdAt: a.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    totalUsers,
    totalMentors,
    totalCourses,
    totalEnrollments,
    revenue,
    activeChatRooms,
    pendingModeration,
    recentActivity,
  };
}

export async function mapModerationItem(
  item: Prisma.ContentModerationQueueGetPayload<{
    include: { reporter: true; reviewer: true };
  }>
): Promise<AdminModerationItem> {
  let contentPreview = `${item.contentType} #${item.contentId}`;

  if (item.contentType === "chat_message") {
    const message = await db.chatMessage.findUnique({ where: { id: item.contentId } });
    if (message) contentPreview = message.content;
  }

  const audits = await db.adminAuditLog.findMany({
    where: { entityType: "moderation", entityId: item.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { admin: true },
  });

  return {
    id: item.id,
    contentType: item.contentType,
    contentId: item.contentId,
    contentPreview,
    reason: item.reason,
    status:
      item.status === ModerationStatus.PENDING
        ? "pending"
        : item.status === ModerationStatus.APPROVED
          ? "approved"
          : "rejected",
    reporterName: item.reporter?.nama,
    reporterEmail: item.reporter?.email,
    createdAt: item.createdAt.toISOString(),
    reviewedAt: item.reviewedAt?.toISOString(),
    history: audits.map((a) => ({
      id: a.id,
      action: a.action,
      actor: a.admin.nama,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export { slugify } from "@/lib/slugify";
