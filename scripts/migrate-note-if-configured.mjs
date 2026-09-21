import { spawnSync } from "node:child_process";

if (!process.env.NOTE_DATABASE_URL) {
  console.log("skip note migrate: NOTE_DATABASE_URL unset");
  process.exit(0);
}

// Resolve any failed migrations before deploy (e.g. BOM-caused syntax errors).
// This is safe: a migration that failed to apply left no schema changes.
const failed = spawnSync(
  "npx",
  ["prisma", "migrate", "status", "--schema", "prisma-note/schema.prisma"],
  { stdio: "pipe", shell: true, env: process.env, encoding: "utf-8" }
);

const statusOut = failed.stdout + failed.stderr;
if (/failed/i.test(statusOut)) {
  // Extract failed migration names and mark them rolled-back.
  const failedNames = [...statusOut.matchAll(/20260\d{8}_\w+/g)].map((m) => m[0]);
  for (const name of [...new Set(failedNames)]) {
    console.log(`resolving failed migration: ${name}`);
    spawnSync(
      "npx",
      ["prisma", "migrate", "resolve", "--rolled-back", name, "--schema", "prisma-note/schema.prisma"],
      { stdio: "inherit", shell: true, env: process.env }
    );
  }
}

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma-note/schema.prisma"],
  { stdio: "inherit", shell: true, env: process.env }
);
process.exit(result.status ?? 1);
