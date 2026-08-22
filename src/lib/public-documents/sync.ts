import type { PrismaClient } from "@prisma/client";

import { db } from "@/lib/db";
import { isBlockedLegalSource, loadAllVaultDocuments } from "./parse-vault";

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
  const publishVault = force || publishAll;
  const docs = await loadAllVaultDocuments();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let published = 0;

  for (const doc of docs) {
    if (isBlockedLegalSource(doc.sourceVaultPath)) {
      skipped++;
      continue;
    }

    const existing = await client.publicDocument.findUnique({
      where: {
        portal_slug_locale: { portal: doc.portal, slug: doc.slug, locale: doc.locale },
      },
    });

    if (existing?.status === "PUBLISHED" && !force) {
      skipped++;
      continue;
    }

    const nextStatus = publishVault ? "PUBLISHED" : existing?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const willPublish = nextStatus === "PUBLISHED" && existing?.status !== "PUBLISHED";

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
          locale: doc.locale,
          status: nextStatus,
          ...(willPublish ? { publishedAt: new Date() } : {}),
        },
      });
      updated++;
    } else {
      await client.publicDocument.create({
        data: {
          portal: doc.portal,
          slug: doc.slug,
          locale: doc.locale,
          title: doc.title,
          eyebrow: doc.eyebrow,
          description: doc.description,
          markdownBody: doc.markdownBody,
          sortOrder: doc.sortOrder,
          sourceVaultPath: doc.sourceVaultPath,
          status: nextStatus,
          publishedAt: publishVault ? new Date() : null,
        },
      });
      created++;
    }

    if (willPublish || (!existing && publishVault)) published++;
  }

  if (publishAll && !force) {
    const result = await client.publicDocument.updateMany({
      where: { status: "DRAFT" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    published += result.count;
  }

  return { created, updated, skipped, published };
}
