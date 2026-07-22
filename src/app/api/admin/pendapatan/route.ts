import { NextResponse } from "next/server";

import { buildRevenueReport, requireAdminPanel, unauthorized } from "@/lib/admin/server";

export async function GET(request: Request) {
  const admin = await requireAdminPanel(request);
  if (!admin) return unauthorized();

  try {
    const report = await buildRevenueReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memuat laporan pendapatan." }, { status: 500 });
  }
}
