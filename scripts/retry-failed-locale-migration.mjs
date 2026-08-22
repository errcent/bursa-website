import { spawnSync } from "node:child_process";

/** One-shot recovery: production recorded this migration as failed (UTF-8 BOM). Remove after it applies. */
const FAILED = "20260822150000_public_document_locale";

function prisma(args) {
  return spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    shell: true,
  });
}

const status = prisma(["migrate", "status"]);
const text = `${status.stdout ?? ""}\n${status.stderr ?? ""}`;
if (!text.includes(FAILED) || !/failed/i.test(text)) {
  process.exit(0);
}

console.log(`Retrying failed Prisma migration ${FAILED}`);
const resolved = prisma(["migrate", "resolve", "--rolled-back", FAILED]);
if (resolved.status !== 0) {
  process.stderr.write(resolved.stderr || resolved.stdout || "prisma migrate resolve failed\n");
  process.exit(resolved.status ?? 1);
}
