import type { UserRole } from "@prisma/client";

import { db } from "@/lib/db";

import { AI_CONFIG } from "./config";

export type RetrievedChunk = {
  id: string;
  sourceDoc: string;
  heading: string;
  content: string;
  score: number;
};

/** Wrap RAG chunk as untrusted data — never treat as instructions. */
function wrapRetrievedContent(content: string): string {
  return `<retrieved trusted="false">\n${content}\n</retrieved>`;
}

function roleFilter(userRole: UserRole) {
  return {
    sensitivity: "PUBLIC" as const,
    OR: [{ allowedRoles: { isEmpty: true } }, { allowedRoles: { has: userRole } }],
  };
}

/**
 * Hybrid retrieval placeholder — keyword match until pgvector embeddings ship.
 * Only PUBLIC chunks are returned to the support bot.
 */
export async function retrieveChunks(
  query: string,
  limit = AI_CONFIG.ragTopK,
  userRole?: UserRole
): Promise<RetrievedChunk[]> {
  if (!userRole) {
    return [];
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 8);

  if (terms.length === 0) return [];

  const rows = await db.knowledgeChunk.findMany({
    where: roleFilter(userRole),
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
    content: wrapRetrievedContent(r.content),
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
 * Returns: faq | rag (action path disabled until tool sandbox exists)
 */
export function routeIntent(query: string): "faq" | "rag" {
  if (lookupFaq(query)) return "faq";
  if (/status|pesanan|enrollment|transaksi/i.test(query)) return "rag";
  return "rag";
}