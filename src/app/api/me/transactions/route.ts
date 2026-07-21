import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";

/**
 * Riwayat transaksi pengguna (3 terakhir) untuk halaman Pengaturan → Pembayaran.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveAuthenticatedUser(request, {
      createIfMissing: false,
      claimedUserId: request.nextUrl.searchParams.get("userId"),
    });

    if (!user) {
      return jsonError("Autentikasi diperlukan.", 401);
    }

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        course: {
          select: { title: true, slug: true },
        },
        mentor: {
          select: { slug: true, user: { select: { nama: true } } },
        },
      },
    });

    return jsonOk({
      transactions: transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        kind: tx.kind,
        createdAt: tx.createdAt.toISOString(),
        // Session payments (kind=SESSION) have no course; label them by mentor (QC-20260719-47).
        courseTitle:
          tx.course?.title ??
          (tx.mentor ? `Sesi 1-on-1 · ${tx.mentor.user.nama}` : "Sesi 1-on-1"),
        courseSlug: tx.course?.slug ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
