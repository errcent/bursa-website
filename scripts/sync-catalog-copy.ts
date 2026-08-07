/**
 * Safe production copy sync: updates course / playlist titles & descriptions
 * from mock-data without deleting modules or lessons.
 *
 * Usage:
 *   CONFIRM_CATALOG_COPY_SYNC=true npx tsx scripts/sync-catalog-copy.ts
 */
import { db } from "../src/lib/db";
import { courses } from "../src/lib/mock-data";
import { CURATED_PLAYLIST_DEFINITIONS } from "../src/lib/seed/preview-catalog";

function assertGuard() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const looksProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    dbUrl.includes("neon.tech") ||
    dbUrl.includes("prod");

  if (looksProd && process.env.CONFIRM_CATALOG_COPY_SYNC !== "true") {
    throw new Error(
      "Catalog copy sync blocked. Set CONFIRM_CATALOG_COPY_SYNC=true deliberately."
    );
  }
}

async function main() {
  assertGuard();

  let coursesUpdated = 0;
  for (const course of courses) {
    const result = await db.course.updateMany({
      where: { slug: course.slug },
      data: {
        title: course.title,
        shortDescription: course.shortDescription,
        outcomes: course.outcomes,
      },
    });
    coursesUpdated += result.count;
  }

  let playlistsUpdated = 0;
  for (const playlist of CURATED_PLAYLIST_DEFINITIONS) {
    const result = await db.playlist.updateMany({
      where: { slug: playlist.slug },
      data: {
        title: playlist.title,
        description: playlist.description,
      },
    });
    playlistsUpdated += result.count;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        coursesUpdated,
        playlistsUpdated,
        message: "Catalog copy synced (titles/descriptions only; curriculum untouched).",
      },
      null,
      2
    )
  );
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
