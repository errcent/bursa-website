import type { PrismaClient } from "@prisma/client";

import { db } from "@/lib/db";
import { loadAllVaultDocuments } from "./parse-vault";

export interface SyncLegalDraftsResult {
  created: number;
  updated: number;
  skipped: number;
  published: number;
}

export interface SyncLegalDraftsOptions {
  force?: boolean;
  publishAll?: boolean;
}

/**
 * Sync vault markdown drafts → PublicDocument. Importable so callers run it in-process
 * instead of shelling out to `npx tsx` on the request path (QC-20260719-25).
 */
export async function syncLegalDrafts(
  options: SyncLegalDraftsOptions = {},
  client: PrismaClient = db
): Promise<SyncLegalDraftsResult> {
  const { force = false, publishAll = false } = options;
  const docs = await loadAllVaultDocuments();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const existing = await client.publicDocument.findUnique({
      where: { portal_slug: { portal: doc.portal, slug: doc.slug } },
    });

    if (existing?.status === "PUBLISHED" && !force) {
      skipped++;
      continue;
    }

    if (existing) {
      await client.publicDocument.update({
        where: { id: existing.id },
        data: {
          title: doc.title,
          eyebrow: doc.eyebrow,
          description: doc.description,
          markdownBody: doc.markdownBody,
          sortOrder: doc.sortOrder,
          sourceVaultPath: doc.sourceVaultPath,
          ...(existing.status === "PUBLISHED" && force
            ? {}
            : { status: existing.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT" }),
        },
      });
      updated++;
    } else {
      await client.publicDocument.create({
        data: {
          portal: doc.portal,
          slug: doc.slug,
          title: doc.title,
          eyebrow: doc.eyebrow,
          description: doc.description,
          markdownBody: doc.markdownBody,
          sortOrder: doc.sortOrder,
          sourceVaultPath: doc.sourceVaultPath,
          status: "DRAFT",
        },
      });
      created++;
    }
  }

  let published = 0;
  if (publishAll) {
    const result = await client.publicDocument.updateMany({
      where: { status: "DRAFT" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    published = result.count;
  }

  return { created, updated, skipped, published };
}
