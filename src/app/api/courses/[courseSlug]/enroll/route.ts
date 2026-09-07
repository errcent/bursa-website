import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser, resolveTrustedEmail } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { hasAllAccess, startCourseEnrollment } from "@/lib/subscription/access";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const email = await resolveTrustedEmail(request);
    if (!email) {
      return jsonOk({ enrolled: false, hasAllAccess: false });
    }

    const user = await resolveRequestUser(
      { userId: "", email },
      { createIfMissing: false }
    );
    if (!user) {
      return jsonOk({ enrolled: false, hasAllAccess: false });
    }

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const [enrollment, allAccess] = await Promise.all([
      db.enrollment.findUnique({
        where: {
          userId_courseId: { userId: user.id, courseId: course.id },
        },
        select: { id: true },
      }),
      hasAllAccess(user.id),
    ]);

    return jsonOk({
      enrolled: allAccess,
      hasAllAccess: allAccess,
      started: Boolean(enrollment),
      enrollmentId: enrollment?.id ?? null,
      hubRoomId: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
    };

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: true,
      claimedUserId: body.userId,
    });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const allAccess = await hasAllAccess(user.id);
    if (!allAccess) {
      return jsonError("Akses katalog memerlukan akun yang aktif.", 403);
    }

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const enrollment = await startCourseEnrollment(user.id, course.id);

    return jsonOk({
      enrollmentId: enrollment.id,
      courseId: course.id,
      hubRoomId: null,
      enrolled: true,
      hasAllAccess: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
