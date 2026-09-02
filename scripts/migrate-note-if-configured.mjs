import { spawnSync } from "node:child_process";

if (!process.env.NOTE_DATABASE_URL) {
  console.log("skip note migrate: NOTE_DATABASE_URL unset");
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma-note/schema.prisma"],
  { stdio: "inherit", shell: true, env: process.env }
);
process.exit(result.status ?? 1);
