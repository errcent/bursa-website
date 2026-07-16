import { NextResponse } from "next/server";

import { requireAdmin, unauthorized } from "@/lib/admin/server";
import { execSync } from "node:child_process";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const websiteRoot = process.cwd();
    execSync("npx tsx scripts/sync-legal-drafts.ts", {
      cwd: websiteRoot,
      stdio: "pipe",
      env: process.env,
    });
    return NextResponse.json({ ok: true, message: "Sync dari vault selesai." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal sync dari vault." }, { status: 500 });
  }
}
