import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { hasAllAccess, startCourseEnrollment } from "@/lib/subscription/access";

const checkoutSchema = z.object({
  courseSlug: z.string().min(1),
});

/**
 * Mobile start-course bridge. Checkout is disabled; logged-in all-access
 * learners start the course directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = checkoutSchema.parse(await request.json());
    const user = await resolveAuthenticatedUser(request, { createIfMissing: false });
    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const course = await db.course.findUnique({
      where: { slug: body.courseSlug },
      select: { id: true, slug: true, title: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const allAccess = await hasAllAccess(user.id);
    if (!allAccess) {
      return jsonError("Akses katalog memerlukan akun yang aktif.", 403);
    }

    const enrollment = await startCourseEnrollment(user.id, course.id);

    return jsonOk({
      alreadyEnrolled: true,
      enrollable: true,
      enrollmentId: enrollment.id,
      message: "Kelas siap dimulai.",
      courseSlug: course.slug,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
