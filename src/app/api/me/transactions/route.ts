import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { resolveRequestUser } from "@/lib/lesson-qa/server";

/**
 * Riwayat transaksi pengguna (3 terakhir) untuk halaman Pengaturan → Pembayaran.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    const email =
      request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
      request.headers.get("x-user-email")?.trim().toLowerCase() ||
      undefined;

    if (!userId && !email) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const user = await resolveRequestUser(
      { userId: userId ?? "", email },
      { createIfMissing: false }
    );

    if (!user) {
      return jsonOk({ transactions: [] });
    }

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        course: {
          select: { title: true, slug: true },
        },
      },
    });

    return jsonOk({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        courseTitle: tx.course.title,
        courseSlug: tx.course.slug,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
