import { ModerationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mapModerationItem, requireAdmin, unauthorized } from "@/lib/admin/server";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const items = await db.contentModerationQueue.findMany({
      include: { reporter: true, reviewer: true },
      orderBy: { createdAt: "desc" },
    });

    const mapped = await Promise.all(items.map(mapModerationItem));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat antrean moderasi." }, { status: 500 });
  }
}
