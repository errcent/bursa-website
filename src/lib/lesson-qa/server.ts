import type { User, UserRole } from "@prisma/client";

import { db } from "@/lib/db";

const MENTOR_ROLES: UserRole[] = ["MENTOR", "ADMIN"];

const ROLE_MAP: Record<string, UserRole> = {
  learner: "LEARNER",
  mentor: "MENTOR",
  admin: "ADMIN",
  developer: "DEVELOPER",
  LEARNER: "LEARNER",
  MENTOR: "MENTOR",
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
};

function mapClientRole(role?: string): UserRole {
  if (!role) return "LEARNER";
  return ROLE_MAP[role] ?? "LEARNER";
}

/**
 * Resolve a client-auth session user to a Prisma User.
 * Client auth uses localStorage IDs that often differ from DB cuids, so we
 * match by email first and upsert when needed (fixes 500 on comment submit).
 */
export async function resolveRequestUser(
  input: {
    userId: string;
    email?: string;
    name?: string;
    role?: string;
  },
  options?: { createIfMissing?: boolean }
): Promise<User | null> {
  const email = input.email?.trim().toLowerCase();
  const createIfMissing = options?.createIfMissing ?? true;

  if (email) {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return existing;

    if (!createIfMissing) return null;

    return db.user.create({
      data: {
        email,
        passwordHash: "client-auth-bridge",
        nama: input.name?.trim() || email.split("@")[0] || "Pengguna",
        role: mapClientRole(input.role),
      },
    });
  }

  return db.user.findUnique({ where: { id: input.userId } });
}

export function isMentorRole(role: UserRole) {
  return MENTOR_ROLES.includes(role);
}

export async function isCourseMentorForLesson(userId: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              mentor: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!lesson) return false;
  return lesson.module.course.mentor.userId === userId;
}

export async function canModerateLessonComments(userId: string, lessonId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "MENTOR") return false;
  return isCourseMentorForLesson(userId, lessonId);
}

export const questionAuthorSelect = { id: true, nama: true, role: true } as const;

export function serializeQuestion(
  question: {
    id: string;
    lessonId: string;
    content: string;
    timestampSeconds: number | null;
    isPinned: boolean;
    likeCount: number;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; nama: string; role: UserRole };
    replies: Array<{
      id: string;
      questionId: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      user: { id: string; nama: string; role: UserRole };
    }>;
    likes?: Array<{ userId: string }>;
  },
  viewerUserId?: string | null
) {
  const likedByMe = viewerUserId
    ? (question.likes?.some((like) => like.userId === viewerUserId) ?? false)
    : false;
  const isMine = Boolean(viewerUserId && question.user.id === viewerUserId);

  return {
    id: question.id,
    lessonId: question.lessonId,
    content: question.content,
    timestampSeconds: question.timestampSeconds,
    isPinned: question.isPinned,
    likeCount: Math.max(0, question.likeCount),
    likedByMe,
    isMine,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
    edited: question.updatedAt.getTime() - question.createdAt.getTime() > 1000,
    user: question.user,
    replies: question.replies.map((reply) => ({
      id: reply.id,
      questionId: reply.questionId,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      edited: reply.updatedAt.getTime() - reply.createdAt.getTime() > 1000,
      user: reply.user,
      isMine: Boolean(viewerUserId && reply.user.id === viewerUserId),
    })),
  };
}
