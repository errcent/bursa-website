import { ChangeRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdminPanel, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";
import {
  changeRequestInclude,
  mapChangeRequest,
} from "@/lib/mentor/change-requests";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    let statusFilter: ChangeRequestStatus | undefined;
    if (statusParam === "pending") statusFilter = ChangeRequestStatus.PENDING;
    if (statusParam === "approved") statusFilter = ChangeRequestStatus.APPROVED;
    if (statusParam === "rejected") statusFilter = ChangeRequestStatus.REJECTED;
    if (statusParam === "edited") statusFilter = ChangeRequestStatus.EDITED;

    const items = await db.courseChangeRequest.findMany({
      where: statusFilter
        ? statusFilter === ChangeRequestStatus.APPROVED
          ? { status: { in: [ChangeRequestStatus.APPROVED, ChangeRequestStatus.EDITED] } }
          : { status: statusFilter }
        : undefined,
      include: changeRequestInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(items.map(mapChangeRequest));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat pengajuan perubahan." }, { status: 500 });
  }
}
