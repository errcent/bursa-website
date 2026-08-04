import { db } from "../src/lib/db";
import { seedPreviewCatalog } from "../src/lib/seed/preview-catalog";

function assertProductionGuard() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    dbUrl.includes("neon.tech") ||
    dbUrl.includes("prod");

  if (isProd && process.env.CONFIRM_PREVIEW_CATALOG_SEED !== "true") {
    throw new Error(
      "Production preview catalog seed blocked. Set CONFIRM_PREVIEW_CATALOG_SEED=true deliberately."
    );
  }
}

async function main() {
  assertProductionGuard();

  const result = await seedPreviewCatalog(db);

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...result,
        message:
          "Preview catalog siap. Admin founder & waitlist tidak disentuh. Mentor preview tidak punya password yang didistribusi.",
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
