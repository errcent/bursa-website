import { NextResponse } from "next/server";

import { assertImageStudioEnabled } from "@/lib/image-studio/guard";
import { buildUsageSummary, listLedgerEntries, readLedgerEntries } from "@/lib/image-studio/ledger";
import type { StudioProviderId } from "@/lib/image-studio/types";

export async function GET(request: Request) {
  const disabled = assertImageStudioEnabled();
  if (disabled) return disabled;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "100");
  const offset = Number(searchParams.get("offset") ?? "0");
  const provider = searchParams.get("provider") as StudioProviderId | null;
  const billingMode = searchParams.get("billing") as "free" | "paid" | null;

  const allEntries = await readLedgerEntries();
  const history = await listLedgerEntries({
    limit: Number.isFinite(limit) ? limit : 100,
    offset: Number.isFinite(offset) ? offset : 0,
    provider: provider === "bfl" || provider === "pollinations" ? provider : undefined,
    billingMode: billingMode === "free" || billingMode === "paid" ? billingMode : undefined,
  });

  const items = history.items.map((entry) => ({
    ...entry,
    imageUrl:
      entry.status === "success" && entry.filePath
        ? `/api/studio/images/${entry.id}`
        : entry.imageUrl ?? null,
  }));

  const summary = buildUsageSummary(allEntries);

  return NextResponse.json({ ...history, items, summary });
}
