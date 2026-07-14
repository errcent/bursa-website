import { db } from "@/lib/db";

import { AI_CONFIG } from "./config";

export type RetrievedChunk = {
  id: string;
  sourceDoc: string;
  heading: string;
  content: string;
  score: number;
};

/**
 * Hybrid retrieval placeholder — keyword match until pgvector embeddings ship.
 * Production: combine vector similarity + keyword filter by role/metadata.
 */
export async function retrieveChunks(
  query: string,
  limit = AI_CONFIG.ragTopK
): Promise<RetrievedChunk[]> {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 8);

  if (terms.length === 0) return [];

  const rows = await db.knowledgeChunk.findMany({
    take: limit * 4,
    orderBy: { updatedAt: "desc" },
  });

  const scored = rows
    .map((row) => {
      const hay = `${row.heading}\n${row.content}`.toLowerCase();
      const score = terms.reduce(
        (acc, term) => acc + (hay.includes(term) ? 1 : 0),
        0
      );
      return { ...row, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((r) => ({
    id: r.id,
    sourceDoc: r.sourceDoc,
    heading: r.heading,
    content: r.content,
    score: r.score,
  }));
}

/** Static FAQ cache — zero LLM tokens on hit. */
const FAQ_CACHE: Record<string, string> = {
  "cara daftar":
    "Buka /daftar, isi email dan kata sandi, atau gunakan Lanjutkan dengan Google di /masuk.",
  komisi:
    "Platform mengambil komisi indikatif ~25% per transaksi course; mentor menentukan harga sendiri.",
  disclaimer:
    "Konten edukasi trading bukan rekomendasi investasi. Trading mengandung risiko kerugian.",
};

export function lookupFaq(query: string): string | null {
  const q = query.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ_CACHE)) {
    if (q.includes(key)) return answer;
  }
  return null;
}

/**
 * Intent router placeholder — cheap classifier before LLM.
 * Returns: faq | rag | action
 */
export function routeIntent(query: string): "faq" | "rag" | "action" {
  if (lookupFaq(query)) return "faq";
  if (/status|pesanan|enrollment|transaksi/i.test(query)) return "action";
  return "rag";
}
