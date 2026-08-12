import seedData from "@/data/image-studio/usage-seed.json";
import { megapixelsFor } from "@/lib/image-studio/config";
import { dedupeLedgerById, readLedgerEntries, upsertLedgerEntries } from "@/lib/image-studio/ledger";
import type { LedgerEntry } from "@/lib/image-studio/types";

type SeedEntry = Omit<
  LedgerEntry,
  "creditsBefore" | "creditsAfter" | "filePath" | "megapixels"
> & {
  creditsBefore?: number | null;
  creditsAfter?: number | null;
  filePath?: string;
};

export async function mergeSeedIfEmpty() {
  await dedupeLedgerById();
  const existing = await readLedgerEntries();
  const existingIds = new Set(existing.map((entry) => entry.id));
  const seeds = seedData as SeedEntry[];

  const missing = seeds.filter((seed) => !existingIds.has(seed.id));
  if (missing.length === 0) {
    return { merged: 0, skipped: existing.length > 0 };
  }

  await upsertLedgerEntries(
    missing.map((seed) => ({
      ...seed,
      provider: seed.provider === "bfl" ? "bfl" : "pollinations",
      creditsBefore: seed.creditsBefore ?? null,
      creditsAfter: seed.creditsAfter ?? null,
      filePath: seed.filePath ?? "",
      megapixels: megapixelsFor(seed.width, seed.height),
    }))
  );

  return { merged: missing.length, skipped: false };
}
