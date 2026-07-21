/**
 * Batch-download AI thumbnails into public/generated/thumbnails/.
 * Prompts are derived from course/playlist metadata in ai-manifest.ts.
 *
 * Usage: npm run thumbnails:generate
 */
import fs from "node:fs";
import path from "node:path";

import { THUMBNAIL_MANIFEST } from "../src/lib/thumbnails/ai-manifest";

function pollinationsUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: "1280",
    height: "800",
    nologo: "true",
    seed: String(seed),
    model: "flux",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

async function downloadEntry(
  kind: string,
  slug: string,
  prompt: string,
  seed: number
): Promise<void> {
  const dest = path.join(
    process.cwd(),
    "public",
    "generated",
    "thumbnails",
    kind,
    `${slug}.webp`
  );

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const res = await fetch(pollinationsUrl(prompt, seed), {
    headers: { Accept: "image/*" },
  });

  if (!res.ok) {
    throw new Error(`Failed ${kind}/${slug}: HTTP ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log(`✓ ${kind}/${slug}.webp`);
}

async function main() {
  console.log(`Generating ${THUMBNAIL_MANIFEST.length} AI thumbnails…\n`);

  for (const entry of THUMBNAIL_MANIFEST) {
    try {
      await downloadEntry(entry.kind, entry.slug, entry.prompt, entry.seed);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      console.error(`✗ ${entry.kind}/${entry.slug}:`, error);
    }
  }

  const promptsPath = path.join(
    process.cwd(),
    "src",
    "data",
    "thumbnail-prompts.json"
  );
  fs.mkdirSync(path.dirname(promptsPath), { recursive: true });
  fs.writeFileSync(
    promptsPath,
    JSON.stringify(
      THUMBNAIL_MANIFEST.map(({ kind, slug, title, prompt, destinationPath }) => ({
        kind,
        slug,
        title,
        destinationPath,
        prompt,
      })),
      null,
      2
    )
  );
  console.log(`\nPrompt manifest written to src/data/thumbnail-prompts.json`);
}

void main();
