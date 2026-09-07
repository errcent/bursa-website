import { spawnSync } from "node:child_process";

/** Recover migrations recorded as failed after UTF-8 BOM broke SQL on first deploy. */
const FAILED_BOM_MIGRATIONS = [
  "20260822150000_public_document_locale",
  "20260907100000_privacy_center_dsar_consent",
  "20260907180000_all_access_subscription",
];

function prisma(args) {
  return spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    shell: true,
  });
}

const status = prisma(["migrate", "status"]);
const text = `${status.stdout ?? ""}\n${status.stderr ?? ""}`;
if (!/failed/i.test(text)) {
  process.exit(0);
}

for (const migration of FAILED_BOM_MIGRATIONS) {
  if (!text.includes(migration)) continue;
  console.log(`Retrying failed Prisma migration ${migration}`);
  const resolved = prisma(["migrate", "resolve", "--rolled-back", migration]);
  if (resolved.status !== 0) {
    process.stderr.write(resolved.stderr || resolved.stdout || "prisma migrate resolve failed\n");
    process.exit(resolved.status ?? 1);
  }
}
