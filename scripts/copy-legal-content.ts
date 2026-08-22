/**
 * Copy vault legal markdown → Website/content/public-documents (bundled for Vercel).
 * Run after editing Documentation/Legal/Publik/
 */
import fs from "node:fs/promises";
import path from "node:path";

const WEBSITE_ROOT = path.resolve(__dirname, "..");
const VAULT_ROOT = path.resolve(WEBSITE_ROOT, "../Documentation/Legal/Publik");
const BUNDLED_ROOT = path.join(WEBSITE_ROOT, "content/public-documents");

const PORTAL_DIRS = ["privasi", "kepercayaan", "syarat"] as const;

async function copyTree(src: string, dst: string) {
  await fs.mkdir(dst, { recursive: true });
  let entries;
  try {
    entries = await fs.readdir(src, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
      continue;
    }
    if (!entry.name.endsWith(".md") || entry.name.startsWith("00 -") || entry.name === "README.md") {
      continue;
    }
    await fs.copyFile(from, to);
  }
}

async function main() {
  for (const dir of PORTAL_DIRS) {
    await copyTree(path.join(VAULT_ROOT, dir), path.join(BUNDLED_ROOT, dir));
  }
  console.log("Copied legal content to content/public-documents/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
