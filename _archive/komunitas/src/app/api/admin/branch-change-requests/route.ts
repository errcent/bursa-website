import { ChangeRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireAdminPanel, unauthorized } from "@/lib/admin/server";
import {
  chatBranchChangeRequestInclude,
  mapChatBranchChangeRequest,
} from "@/lib/chat/branch-change-requests";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    let status: ChangeRequestStatus | undefined;
    if (statusParam === "pending") status = ChangeRequestStatus.PENDING;
    if (statusParam === "approved") status = ChangeRequestStatus.APPROVED;
    if (statusParam === "rejected") status = ChangeRequestStatus.REJECTED;
    if (statusParam === "edited") status = ChangeRequestStatus.EDITED;

    const items = await db.chatBranchChangeRequest.findMany({
      where: status ? { status } : {},
      include: chatBranchChangeRequestInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items.map(mapChatBranchChangeRequest));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat usulan cabang." }, { status: 500 });
  }
}
