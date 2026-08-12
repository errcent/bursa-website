/**
 * Generate MasterClass portrait course thumbnails via BFL API (FLUX.2 Max).
 * Requires BFL_API_KEY in .env.local.
 *
 * Usage:
 *   npx tsx scripts/generate-portrait-thumbnails-bfl.ts
 *   npx tsx scripts/generate-portrait-thumbnails-bfl.ts forex-makro-dasar defi-dan-tokenomics-pemula
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(path.join(process.cwd()));

import { bflFluxProvider } from "../src/lib/image-studio/providers/bfl-flux";
import {
  MASTERCLASS_PORTRAIT_PROMPTS,
  MASTERCLASS_PORTRAIT_SEEDS,
} from "../src/lib/thumbnails/masterclass-prompts";

const DEFAULT_SLUGS = [
  "forex-makro-dasar",
  "defi-dan-tokenomics-pemula",
  "siklus-bitcoin-halving-dan-makro-kripto",
];

async function main() {
  const slugs =
    process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_SLUGS;

  if (!bflFluxProvider.isConfigured()) {
    throw new Error("BFL_API_KEY belum diset di .env.local");
  }

  const credits = await bflFluxProvider.getCredits();
  console.log(
    `BFL: paid credits=${credits.paidCredits ?? 0} (free pool MCP=${credits.freeGenerationsRemaining ?? 0})\n`
  );

  if ((credits.paidCredits ?? 0) <= 0 && (credits.freeGenerationsRemaining ?? 0) <= 0) {
    throw new Error(
      "Saldo BFL 0 - top-up di https://api.bfl.ai lalu jalankan script lagi"
    );
  }

  const outDir = path.join("public", "generated", "thumbnails", "course");
  fs.mkdirSync(outDir, { recursive: true });

  for (const slug of slugs) {
    const prompt = MASTERCLASS_PORTRAIT_PROMPTS[slug];
    const seed = MASTERCLASS_PORTRAIT_SEEDS[slug];
    if (!prompt || !seed) {
      console.error(`✗ ${slug}: tidak ada prompt/seed`);
      continue;
    }

    console.log(`→ Generating ${slug} (seed ${seed})…`);
    try {
      const result = await bflFluxProvider.generate({
        providerId: "bfl",
        modelId: "flux-2-max",
        prompt,
        width: 1920,
        height: 1080,
        seed,
      });

      const dest = path.join(outDir, `${slug}.webp`);
      await sharp(result.imageBuffer)
        .resize(1920, 1080, { fit: "cover" })
        .webp({ quality: 90 })
        .toFile(dest);

      console.log(
        `✓ ${dest} (${result.billingMode}, ${result.creditsUsed} credits)`
      );
    } catch (error) {
      console.error(`✗ ${slug}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
