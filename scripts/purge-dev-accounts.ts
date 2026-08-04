import { db } from "../src/lib/db";

const DEV_EMAIL_PATTERNS = [
  "@test.dev",
  "@mentor.bursa.dev",
  "@dev.bursa.dev",
  "admin@test.dev",
  "demo@bursanalar.com",
  "learner@test.dev",
  "mentor@test.dev",
  "developer@test.dev",
];

function assertProductionGuard() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    (process.env.DATABASE_URL ?? "").includes("neon.tech");

  if (isProd && process.env.CONFIRM_PRODUCTION_PURGE !== "true") {
    throw new Error("Production purge blocked. Set CONFIRM_PRODUCTION_PURGE=true deliberately.");
  }
}

async function main() {
  assertProductionGuard();

  const candidates = await db.user.findMany({
    where: {
      OR: DEV_EMAIL_PATTERNS.map((pattern) =>
        pattern.startsWith("@")
          ? { email: { endsWith: pattern } }
          : { email: pattern }
      ),
    },
    select: { id: true, email: true, role: true },
  });

  if (candidates.length === 0) {
    console.log(JSON.stringify({ ok: true, deleted: 0, message: "No dev accounts found." }));
    return;
  }

  const deleted = await db.user.deleteMany({
    where: { id: { in: candidates.map((user) => user.id) } },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted: deleted.count,
        emails: candidates.map((user) => user.email),
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
