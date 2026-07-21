import { NextResponse } from "next/server";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { syncLegalDrafts } from "@/lib/public-documents/sync";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      force?: boolean;
      publishAll?: boolean;
    };
    const result = await syncLegalDrafts({
      force: body.force ?? false,
      publishAll: body.publishAll ?? false,
    });
    return NextResponse.json({
      ok: true,
      message: `Sync dari vault selesai: ${result.created} baru, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
      ...result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal sync dari vault." }, { status: 500 });
  }
}
