import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { ensureHubMembershipForCourseEnrollment } from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

/**
 * Check whether the current user is enrolled (subscribed) in this course.
 * Query: ?userId=&email=  or header x-user-email.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email =
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;

    if (!userId && !email) {
      return jsonOk({ enrolled: false });
    }

    const user = await resolveRequestUser(
      { userId: userId ?? "", email },
      { createIfMissing: false }
    );
    if (!user) {
      return jsonOk({ enrolled: false });
    }

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: course.id },
      },
      select: { id: true },
    });

    // Heal hub membership if enrollment exists but ChatRoomMember was missed
    // (e.g. older enroll path before client-auth bridge).
    let hubRoomId: string | null = null;
    if (enrollment) {
      const hub = await ensureHubMembershipForCourseEnrollment({
        userId: user.id,
        courseId: course.id,
      });
      hubRoomId = hub?.roomId ?? null;
    }

    return jsonOk({
      enrolled: Boolean(enrollment),
      enrollmentId: enrollment?.id ?? null,
      hubRoomId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Demo / future checkout hook: create enrollment and subscribe the learner
 * to that mentor's community hub (ChatRoomMember).
 *
 * Client-auth users live in localStorage and often have no Prisma row yet —
 * resolveRequestUser({ createIfMissing: true }) bridges by email so hub
 * membership is created for newly registered checkout users.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      role?: string;
      userId?: string;
    };

    const email =
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      body.email?.trim().toLowerCase() ||
      undefined;
    if (!email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      {
        userId: body.userId?.trim() || "",
        email,
        name: body.name,
        role: body.role,
      },
      { createIfMissing: true }
    );
    if (!user) {
      return jsonError("Pengguna tidak ditemukan.", 404);
    }

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true, mentorId: true, title: true, price: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const existing = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: course.id },
      },
    });

    const enrollment = await db.enrollment.upsert({
      where: {
        userId_courseId: { userId: user.id, courseId: course.id },
      },
      create: { userId: user.id, courseId: course.id },
      update: {},
    });

    // Record revenue line on first enrollment (demo checkout → real Transaction row).
    if (!existing) {
      await db.transaction.create({
        data: {
          userId: user.id,
          courseId: course.id,
          amount: course.price,
          status: "COMPLETED",
        },
      });
    }

    const hub = await ensureHubMembershipForCourseEnrollment({
      userId: user.id,
      courseId: course.id,
    });

    return jsonOk({
      enrollmentId: enrollment.id,
      courseId: course.id,
      hubRoomId: hub?.roomId ?? null,
      enrolled: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
