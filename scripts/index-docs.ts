/**
 * RAG indexer — parses vault docs into KnowledgeChunk rows.
 * Scope: Documentation/03 (product) + Documentation/04/03 As-Built only.
 * Run: npm run index-docs (weekly cron or on deploy — not realtime full vault)
 *
 * Embedding generation is stubbed until AI_GATEWAY_URL is configured.
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const WORKSPACE_ROOT = path.resolve(__dirname, "../..");
const DOC_ROOTS = [
  path.join(WORKSPACE_ROOT, "Documentation/03 - Produk & Spesifikasi"),
  path.join(WORKSPACE_ROOT, "Documentation/04 - Engineering/03 - As-Built Reference"),
];

const MAX_CHUNK_CHARS = 2000;

type ChunkDraft = {
  sourceDoc: string;
  heading: string;
  content: string;
};

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "archive") continue;
      files.push(...(await collectMarkdownFiles(full)));
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }

  return files;
}

function chunkByHeadings(sourceDoc: string, raw: string): ChunkDraft[] {
  const lines = raw.split(/\r?\n/);
  const chunks: ChunkDraft[] = [];
  let heading = "(intro)";
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content.length < 40) return;

    if (content.length <= MAX_CHUNK_CHARS) {
      chunks.push({ sourceDoc, heading, content });
    } else {
      for (let i = 0; i < content.length; i += MAX_CHUNK_CHARS) {
        chunks.push({
          sourceDoc,
          heading: `${heading} [${Math.floor(i / MAX_CHUNK_CHARS) + 1}]`,
          content: content.slice(i, i + MAX_CHUNK_CHARS),
        });
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    const hMatch = line.match(/^#{1,3}\s+(.+)/);
    if (hMatch) {
      flush();
      heading = hMatch[1].trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  return chunks;
}

async function main() {
  const allFiles: string[] = [];
  for (const root of DOC_ROOTS) {
    try {
      allFiles.push(...(await collectMarkdownFiles(root)));
    } catch {
      console.warn(`[index-docs] Skip missing root: ${root}`);
    }
  }

  console.log(`[index-docs] Found ${allFiles.length} markdown files`);

  let upserted = 0;
  for (const filePath of allFiles) {
    const rel = path.relative(WORKSPACE_ROOT, filePath).replace(/\\/g, "/");
    const raw = await fs.readFile(filePath, "utf8");
    const drafts = chunkByHeadings(rel, raw);

    for (const draft of drafts) {
      const existing = await prisma.knowledgeChunk.findFirst({
        where: { sourceDoc: draft.sourceDoc, heading: draft.heading },
      });

      if (existing) {
        await prisma.knowledgeChunk.update({
          where: { id: existing.id },
          data: { content: draft.content, tokenCount: Math.ceil(draft.content.length / 4) },
        });
      } else {
        await prisma.knowledgeChunk.create({
          data: {
            ...draft,
            tokenCount: Math.ceil(draft.content.length / 4),
          },
        });
      }
      upserted++;
    }
  }

  console.log(`[index-docs] Upserted ${upserted} chunks`);
  console.log(
    "[index-docs] Embedding stub — configure AI_GATEWAY_URL for vector generation"
  );
}

main()
  .catch((err) => {
    console.error("[index-docs] Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
