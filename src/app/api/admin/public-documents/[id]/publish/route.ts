import { NextResponse } from "next/server";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  const { id } = await context.params;

  try {
    const doc = await db.publicDocument.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    return NextResponse.json(doc);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal publish dokumen." }, { status: 500 });
  }
}
