import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireMentor, unauthorizedMentor } from "@/lib/mentor/server";

function maskLearnerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export async function GET(request: NextRequest) {
  const mentor = await requireMentor(request);
  if (!mentor) return unauthorizedMentor();

  const mentorId = mentor.mentorProfile!.id;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "20") || 20)
  );
  const skip = (page - 1) * limit;

  try {
    const [items, total] = await Promise.all([
      db.commissionRecord.findMany({
        where: { mentorId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          transaction: {
            include: {
              course: { select: { title: true, slug: true } },
              user: { select: { nama: true } },
            },
          },
        },
      }),
      db.commissionRecord.count({ where: { mentorId } }),
    ]);

    return NextResponse.json({
      items: items.map((row) => ({
        id: row.id,
        transactionId: row.transactionId,
        createdAt: row.createdAt.toISOString(),
        courseTitle: row.transaction.course.title,
        courseSlug: row.transaction.course.slug,
        learnerInitials: maskLearnerInitials(row.transaction.user.nama),
        grossAmount: row.grossAmount,
        commissionPct: row.commissionPct,
        commissionAmount: row.commissionAmount,
        netMentorAmount: row.netMentorAmount,
        payoutStatus: row.payoutStatus,
        payoutPeriod: row.payoutPeriod,
        transactionStatus: row.transaction.status,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat transaksi mentor." }, { status: 500 });
  }
}
