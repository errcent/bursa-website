import { NextResponse } from "next/server";
import type { DataSubjectRequestStatus } from "@prisma/client";

import { requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as DataSubjectRequestStatus | null;

  const rows = await db.dataSubjectRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(rows);
}
