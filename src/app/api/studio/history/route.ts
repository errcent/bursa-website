import { NextResponse } from "next/server";

import { assertImageStudioAdmin } from "@/lib/image-studio/guard";
import { mergeSeedIfEmpty } from "@/lib/image-studio/import-seed";
import { listLedgerEntries } from "@/lib/image-studio/ledger";

export async function GET(request: Request) {
  const gate = await assertImageStudioAdmin(request);
  if ("error" in gate) return gate.error;

  await mergeSeedIfEmpty();

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  const history = await listLedgerEntries({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  const items = history.items.map((entry) => ({
    ...entry,
    imageUrl:
      entry.status === "success" && entry.filePath
        ? `/api/studio/images/${entry.id}`
        : entry.imageUrl ?? null,
  }));

  return NextResponse.json({ ...history, items });
}
