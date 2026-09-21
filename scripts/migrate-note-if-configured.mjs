import { spawnSync } from "node:child_process";

if (!process.env.NOTE_DATABASE_URL) {
  console.log("skip note migrate: NOTE_DATABASE_URL unset");
  process.exit(0);
}

// One-time: resolve the BOM-caused failed migration so deploy can proceed.
// The migration SQL has been fixed (BOM stripped); this just clears the
// failed entry from _prisma_migrations so it can be re-applied cleanly.
const KNOWN_FAILED = ["20260921150000_journal_db_props"];
for (const name of KNOWN_FAILED) {
  console.log(`resolving failed migration: ${name}`);
  spawnSync(
    "npx",
    ["prisma", "migrate", "resolve", "--rolled-back", name, "--schema", "prisma-note/schema.prisma"],
    { stdio: "inherit", shell: true, env: process.env }
  );
}

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma-note/schema.prisma"],
  { stdio: "inherit", shell: true, env: process.env }
);
process.exit(result.status ?? 1);
