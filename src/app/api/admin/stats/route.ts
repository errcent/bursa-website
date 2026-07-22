import { NextResponse } from "next/server";

import { buildStats, requireAdminPanel, unauthorized } from "@/lib/admin/server";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const stats = await buildStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat statistik." }, { status: 500 });
  }
}
