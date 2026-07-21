/**
 * Sync vault markdown drafts → PublicDocument (status DRAFT).
 * Run: npm run sync-legal
 * Flags: --force to overwrite PUBLISHED docs, --publish-all to publish drafts
 */

import { PrismaClient } from "@prisma/client";

import { syncLegalDrafts } from "../src/lib/public-documents/sync";

const prisma = new PrismaClient();

async function main() {
  const result = await syncLegalDrafts(
    {
      force: process.argv.includes("--force"),
      publishAll: process.argv.includes("--publish-all"),
    },
    prisma
  );

  console.log(
    `Sync selesai: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped (published).`
  );
  if (result.published > 0) {
    console.log(`Published ${result.published} documents.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
