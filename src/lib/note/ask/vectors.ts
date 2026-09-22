/**
 * pgvector retrieval adapter (graceful).
 *
 * Stores per-trade summary embeddings in a per-user namespace and runs
 * cosine retrieval for Ask citations. Every entry point degrades to null
 * when pgvector, the table, or an embedding key is unavailable — callers
 * must fall back to keyword retrieval. Nothing here throws.
 */

import { getNotePrisma } from "@/lib/note/db";
import { citeTrade, type RankedTrade } from "./retrieve";
import type { JournalEntry } from "@/lib/note/types";

export function tradeSummary(entry: JournalEntry): string {
  const parts = [
    entry.symbol,
    entry.side,
    `pnl ${entry.pnl ?? 0}`,
    entry.result ?? "",
    entry.emotion ? `emotion ${entry.emotion}` : "",
    entry.thesis ? `thesis ${entry.thesis}` : "",
    entry.lesson ? `lesson ${entry.lesson}` : "",
  ];
  return parts.filter(Boolean).join(" · ").slice(0, 500);
}

type PrismaVectorClient = {
  $executeRawUnsafe?: (sql: string, ...args: unknown[]) => Promise<unknown>;
  $queryRawUnsafe?: <T>(sql: string, ...args: unknown[]) => Promise<T>;
};

function vectorOf(values: number[]): string {
  return `[${values.join(",")}]`;
}

export async function storeAskEmbeddings(
  apexUserId: string,
  items: { entry: JournalEntry; embedding: number[] }[],
): Promise<boolean> {
  try {
    const db = getNotePrisma() as unknown as PrismaVectorClient;
    if (typeof db.$executeRawUnsafe !== "function") return false;
    for (const item of items.slice(0, 10)) {
      await db.$executeRawUnsafe(
        `INSERT INTO "NoteAskEmbedding" ("id", "apexUserId", "ref", "summary", "embedding", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, NOW())
         ON CONFLICT ("apexUserId", "ref") DO UPDATE SET "summary" = EXCLUDED."summary", "embedding" = EXCLUDED."embedding", "updatedAt" = NOW()`,
        apexUserId,
        item.entry.id,
        tradeSummary(item.entry),
        vectorOf(item.embedding),
      );
    }
    return true;
  } catch {
    return false;
  }
}

export async function searchAskVectors(
  apexUserId: string,
  embedding: number[],
  entriesById: Map<string, JournalEntry>,
  k = 5,
): Promise<RankedTrade[] | null> {
  try {
    const db = getNotePrisma() as unknown as PrismaVectorClient;
    if (typeof db.$queryRawUnsafe !== "function") return null;
    const rows = await db.$queryRawUnsafe<{ ref: string; score: number }[]>(
      `SELECT "ref", 1 - ("embedding" <=> $2::vector) AS score
       FROM "NoteAskEmbedding" WHERE "apexUserId" = $1
       ORDER BY "embedding" <=> $2::vector LIMIT $3`,
      apexUserId,
      vectorOf(embedding),
      k,
    );
    const out: RankedTrade[] = [];
    for (const row of rows ?? []) {
      const entry = entriesById.get(row.ref);
      if (entry) out.push({ entry, score: Number(row.score) || 0 });
    }
    return out;
  } catch {
    return null;
  }
}

export { citeTrade };
