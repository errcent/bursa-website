import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser, resolveTrustedEmail } from "@/lib/auth/request-identity";
import { isPrototypeMode } from "@/lib/auth/prototype";
import { ensureHubMembershipForCourseEnrollment } from "@/lib/chat/db-rooms";
import { db } from "@/lib/db";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { resolveRequestUser } from "@/lib/lesson-qa/server";
import { createCommissionRecordForTransaction } from "@/lib/mentor/commission";
import { recalculateStatsForCourse } from "@/lib/stats/server";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;
    const email = await resolveTrustedEmail(request);
    if (!email) {
      return jsonOk({ enrolled: false });
    }

    const user = await resolveRequestUser(
      { userId: "", email },
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

    let hubRoomId: string | null = null;
    if (enrollment && KOMUNITAS_ENABLED) {
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

    const course = await db.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true, mentorId: true, title: true, price: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const isFreeCourse = course.price <= 0;
    if (!isPrototypeMode() && !isFreeCourse) {
      return jsonError(
        "Enrollment berbayar memerlukan pembayaran melalui checkout.",
        402
      );
    }

    const existing = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId: user.id, courseId: course.id },
      },
    });

    const isPaidEnrollment = course.price > 0;

    // Atomic: enrollment + transaction + commission written together so a mid-way
    // failure cannot leave an enrollment without a matching ledger entry (QC-20260719-36).
    const enrollment = await db.$transaction(async (tx) => {
      const enrollmentRow = await tx.enrollment.upsert({
        where: {
          userId_courseId: { userId: user.id, courseId: course.id },
        },
        create: { userId: user.id, courseId: course.id, isPaid: isPaidEnrollment },
        update: isPaidEnrollment ? { isPaid: true } : {},
      });

      if (!existing) {
        // Idempotency guard against duplicate COMPLETED transactions on retry (QC-20260719-30).
        const idempotencyKey = `enroll:${user.id}:${course.id}`;
        const alreadyBooked = await tx.transaction.findUnique({
          where: { idempotencyKey },
          select: { id: true },
        });

        if (!alreadyBooked) {
          const transaction = await tx.transaction.create({
            data: {
              userId: user.id,
              courseId: course.id,
              amount: course.price,
              status: "COMPLETED",
              idempotencyKey,
            },
          });

          // Commission ledger is created atomically with the transaction (QC-20260719-13).
          if (isPaidEnrollment) {
            await createCommissionRecordForTransaction(
              {
                transactionId: transaction.id,
                mentorId: course.mentorId,
                grossAmount: course.price,
              },
              tx
            );
          }
        }
      }

      return enrollmentRow;
    });

    const hub = KOMUNITAS_ENABLED
      ? await ensureHubMembershipForCourseEnrollment({
          userId: user.id,
          courseId: course.id,
        })
      : null;

    if (!existing) {
      await recalculateStatsForCourse(course.id);
    }

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
