import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { isPrototypeMode } from "@/lib/auth/prototype";
import { db } from "@/lib/db";

const checkoutSchema = z.object({
  courseSlug: z.string().min(1),
});

/**
 * Mobile checkout bridge — returns web checkout URL for paid courses,
 * or indicates free/prototype direct enroll path.
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
      select: { id: true, slug: true, title: true, price: true },
    });
    if (!course) {
      return jsonError("Kelas tidak ditemukan.", 404);
    }

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true },
    });
    if (existing) {
      return jsonOk({
        alreadyEnrolled: true,
        enrollable: false,
        message: "Anda sudah terdaftar di kelas ini.",
        courseSlug: course.slug,
      });
    }

    const isFree = course.price <= 0;
    if (isFree || isPrototypeMode()) {
      return jsonOk({
        alreadyEnrolled: false,
        enrollable: true,
        isFree,
        prototypeMode: isPrototypeMode(),
        message: isFree
          ? "Kelas gratis — lanjutkan enrollment langsung."
          : "Mode prototype — enrollment langsung tersedia.",
        courseSlug: course.slug,
      });
    }

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ||
      "https://bursa-website.vercel.app";

    return jsonOk({
      alreadyEnrolled: false,
      enrollable: false,
      checkoutUrl: `${baseUrl}/checkout/${course.slug}`,
      message: "Lanjutkan pembayaran melalui checkout web.",
      courseSlug: course.slug,
      price: course.price,
      title: course.title,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
