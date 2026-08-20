import { NextResponse } from "next/server";

/** BN-SEC-007: public document upload is retired. L1 has no files; L2 uses private URLs. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Unggahan dokumen publik sudah dinonaktifkan. L1 tidak menerima file. Untuk tahap 2, kirim tautan privat (Drive, Loom, YouTube unlisted).",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
