import { NextRequest } from "next/server";
import { z } from "zod";
import type { CourseDisputeCategory } from "@prisma/client";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";
import { getEnrollmentAccess } from "@/lib/enrollment/access";

type RouteContext = { params: Promise<{ courseSlug: string }> };

const createDisputeSchema = z.object({
  userId: z.string().optional(),
  category: z.enum([
    "CONTENT_QUALITY",
    "OUTDATED",
    "MISLEADING",
    "TECHNICAL",
    "ACCESS",
    "OTHER",
  ]),
  description: z.string().min(20, "Jelaskan keluhan minimal 20 karakter."),
});

/**
 * NO-REFUND post-purchase dispute intake (QC-20260719-33, founder override).
 *
 * There is deliberately NO money-back path. A dispute obligates the mentor to
 * respond/remediate; resolutions are content improvement, non-cash platform credit
 * toward ANOTHER course, or replacement access — handled downstream by mentor/admin.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const body = createDisputeSchema.parse(await request.json());

    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: body.userId,
    });
    if (!user) return jsonError("Masuk terlebih dahulu.", 401);

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) return jsonError("Kelas tidak ditemukan.", 404);

    // Only actual buyers may open a dispute (verified enrollment + paid purchase).
    const access = await getEnrollmentAccess(user.id, course.id);
    if (!access.enrolled || !access.isPaid) {
      return jsonError("Hanya pembeli kelas ini yang dapat mengajukan keluhan.", 403);
    }

    const existing = await db.courseDispute.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true, status: true },
    });
    if (existing) {
      return jsonError("Kamu sudah mengajukan keluhan untuk kelas ini.", 409);
    }

    const dispute = await db.courseDispute.create({
      data: {
        userId: user.id,
        courseId: course.id,
        transactionId: access.paidTransactionId ?? null,
        category: body.category as CourseDisputeCategory,
        description: body.description,
      },
    });

    return jsonOk(
      {
        dispute: { id: dispute.id, status: dispute.status },
        message:
          "Keluhan diterima. Mentor wajib menanggapi & memperbaiki. Tidak ada pengembalian dana — " +
          "solusi berupa perbaikan konten, kredit untuk kelas lain, atau akses pengganti.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
