/**
 * Copy vault legal markdown → Website/content/public-documents (bundled for Vercel).
 * Run after editing Documentation/02 - Legal & Kepatuhan/05 - Halaman Publik Website/
 */
import fs from "node:fs/promises";
import path from "node:path";

const WEBSITE_ROOT = path.resolve(__dirname, "..");
const VAULT_ROOT = path.resolve(
  WEBSITE_ROOT,
  "../Documentation/02 - Legal & Kepatuhan/05 - Halaman Publik Website"
);
const BUNDLED_ROOT = path.join(WEBSITE_ROOT, "content/public-documents");

async function copyDir(sub: "privasi" | "kepercayaan") {
  const src = path.join(VAULT_ROOT, sub);
  const dst = path.join(BUNDLED_ROOT, sub);
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src);
  for (const name of entries) {
    if (!name.endsWith(".md") || name.startsWith("00 -")) continue;
    await fs.copyFile(path.join(src, name), path.join(dst, name));
  }
}

async function main() {
  await copyDir("privasi");
  await copyDir("kepercayaan");
  console.log("Copied legal content to content/public-documents/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
