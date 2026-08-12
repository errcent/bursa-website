import { NextResponse } from "next/server";

import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { ledgerEntryExists, readStudioImage } from "@/lib/image-studio/ledger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  const { id } = await context.params;
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const exists = await ledgerEntryExists(id);
  if (!exists) {
    return NextResponse.json({ error: "Gambar tidak ditemukan." }, { status: 404 });
  }

  try {
    const buffer = await readStudioImage(id);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 404 });
  }
}
