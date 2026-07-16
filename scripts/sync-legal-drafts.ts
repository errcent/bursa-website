/**
 * Sync vault markdown drafts → PublicDocument (status DRAFT).
 * Run: npm run sync-legal
 * Flags: --force to overwrite PUBLISHED docs
 */

import { PrismaClient } from "@prisma/client";

import { loadAllVaultDocuments } from "../src/lib/public-documents/parse-vault";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

async function main() {
  const docs = await loadAllVaultDocuments();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const existing = await prisma.publicDocument.findUnique({
      where: { portal_slug: { portal: doc.portal, slug: doc.slug } },
    });

    if (existing?.status === "PUBLISHED" && !force) {
      skipped++;
      continue;
    }

    if (existing) {
      await prisma.publicDocument.update({
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
      await prisma.publicDocument.create({
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

  console.log(`Sync selesai: ${created} created, ${updated} updated, ${skipped} skipped (published).`);

  if (process.argv.includes("--publish-all")) {
    const result = await prisma.publicDocument.updateMany({
      where: { status: "DRAFT" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    console.log(`Published ${result.count} documents.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
