import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";

import { megapixelsFor, STUDIO_DATA_DIR, STUDIO_IMAGES_DIR, STUDIO_LEDGER_PATH } from "@/lib/image-studio/config";
import type { LedgerEntry, ProviderStats, StudioProviderId, UsageSummary } from "@/lib/image-studio/types";

async function ensureDataDirs() {
  await fs.mkdir(STUDIO_IMAGES_DIR, { recursive: true });
}

export async function readLedgerEntries(): Promise<LedgerEntry[]> {
  try {
    const raw = await fs.readFile(STUDIO_LEDGER_PATH, "utf8");
    const parsed = JSON.parse(raw) as LedgerEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLedgerEntry);
  } catch {
    return [];
  }
}

function normalizeLedgerEntry(entry: LedgerEntry): LedgerEntry {
  return {
    ...entry,
    creditsUsed: entry.creditsUsed ?? null,
    billingMode: entry.billingMode ?? (entry.isFree ? "free" : "paid"),
    isFree: entry.isFree ?? entry.billingMode === "free",
    source: entry.source ?? "studio",
    megapixels: entry.megapixels ?? megapixelsFor(entry.width, entry.height),
    filePath: entry.filePath ?? "",
  };
}

async function writeLedgerFile(entries: LedgerEntry[]) {
  await ensureDataDirs();
  await fs.writeFile(STUDIO_LEDGER_PATH, JSON.stringify(entries, null, 2), "utf8");
}

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export async function appendLedgerEntry(
  entry: Omit<LedgerEntry, "id" | "createdAt" | "megapixels"> & {
    id?: string;
    createdAt?: string;
    megapixels?: number;
  }
) {
  const entries = await readLedgerEntries();
  const next: LedgerEntry = normalizeLedgerEntry({
    ...entry,
    id: entry.id ?? randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    megapixels: entry.megapixels ?? megapixelsFor(entry.width, entry.height),
  });
  if (entry.id && entries.some((existing) => existing.id === entry.id)) {
    return entries.find((existing) => existing.id === entry.id)!;
  }
  entries.unshift(next);
  await writeLedgerFile(entries);
  return next;
}

export async function dedupeLedgerById() {
  const entries = await readLedgerEntries();
  const byId = new Map<string, LedgerEntry>();
  for (const entry of entries) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }
  if (byId.size === entries.length) return entries;

  const deduped = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  await writeLedgerFile(deduped);
  return deduped;
}

export async function upsertLedgerEntries(newEntries: LedgerEntry[]) {
  const entries = await readLedgerEntries();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  for (const entry of newEntries) {
    const normalized = normalizeLedgerEntry(entry);
    if (!byId.has(normalized.id)) {
      byId.set(normalized.id, normalized);
    }
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  await writeLedgerFile(merged);
  return merged;
}

export async function listLedgerEntries(options?: {
  limit?: number;
  offset?: number;
  provider?: StudioProviderId;
  billingMode?: "free" | "paid";
}) {
  let entries = await readLedgerEntries();

  if (options?.provider) {
    entries = entries.filter((entry) => entry.provider === options.provider);
  }
  if (options?.billingMode) {
    entries = entries.filter((entry) => entry.billingMode === options.billingMode);
  }

  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 50;

  return {
    total: entries.length,
    items: entries.slice(offset, offset + limit),
  };
}

export function aggregateProviderStats(
  entries: LedgerEntry[],
  providerId: StudioProviderId
): ProviderStats {
  const providerEntries = entries.filter(
    (entry) => entry.provider === providerId && entry.status === "success"
  );
  const todayEntries = providerEntries.filter((entry) => isToday(entry.createdAt));
  const freeEntries = providerEntries.filter((entry) => entry.billingMode === "free");

  return {
    providerId,
    totalGenerated: providerEntries.length,
    generatedToday: todayEntries.length,
    totalCostEstimate: providerEntries.reduce((sum, entry) => sum + entry.costEstimate, 0),
    costToday: todayEntries.reduce((sum, entry) => sum + entry.costEstimate, 0),
    freeGenerated: freeEntries.length,
    paidGenerated: providerEntries.length - freeEntries.length,
  };
}

export function buildUsageSummary(entries: LedgerEntry[]): UsageSummary {
  const success = entries.filter((entry) => entry.status === "success");
  const free = success.filter((entry) => entry.billingMode === "free");

  return {
    totalEntries: entries.length,
    freeGenerated: free.length,
    paidGenerated: success.length - free.length,
    totalCreditsUsed: success.reduce((sum, entry) => sum + (entry.creditsUsed ?? 0), 0),
    bflFreeUsed: free.filter((entry) => entry.provider === "bfl").length,
  };
}

export async function getAllProviderStats() {
  const entries = await readLedgerEntries();
  return {
    bfl: aggregateProviderStats(entries, "bfl"),
    pollinations: aggregateProviderStats(entries, "pollinations"),
  };
}

export async function countBflFreeUsed() {
  const entries = await readLedgerEntries();
  return entries.filter(
    (entry) => entry.provider === "bfl" && entry.status === "success" && entry.billingMode === "free"
  ).length;
}

export async function saveStudioImage(id: string, buffer: Buffer) {
  await ensureDataDirs();
  const filePath = `${STUDIO_IMAGES_DIR}/${id}.webp`;
  const sharp = (await import("sharp")).default;
  const webp = await sharp(buffer).webp({ quality: 90 }).toBuffer();
  await fs.writeFile(filePath, webp);
  return filePath;
}

export async function readStudioImage(id: string) {
  const filePath = `${STUDIO_IMAGES_DIR}/${id}.webp`;
  return fs.readFile(filePath);
}

export async function ledgerEntryExists(id: string) {
  const entries = await readLedgerEntries();
  return entries.some((entry) => entry.id === id);
}
