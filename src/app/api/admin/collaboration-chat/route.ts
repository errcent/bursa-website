import { NextResponse } from "next/server";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { listMentorAdminChatRoomSummaries } from "@/lib/mentor/collaboration-chat";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const rooms = await listMentorAdminChatRoomSummaries();
    return NextResponse.json({
      rooms,
      currentUserId: admin.id,
    });
  } catch (error) {
    console.error("[admin/collaboration-chat]", error);
    return NextResponse.json(
      {
        error: "Gagal memuat ruang kolaborasi mentor–admin.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
