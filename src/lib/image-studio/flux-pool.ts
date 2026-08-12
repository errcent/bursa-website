import { promises as fs } from "node:fs";

import { STUDIO_DATA_DIR, STUDIO_FLUX_POOL_PATH } from "@/lib/image-studio/config";
import type { FluxPoolSnapshot } from "@/lib/image-studio/types";

async function ensureDataDir() {
  await fs.mkdir(STUDIO_DATA_DIR, { recursive: true });
}

export async function readFluxPoolSnapshot(): Promise<FluxPoolSnapshot | null> {
  try {
    const raw = await fs.readFile(STUDIO_FLUX_POOL_PATH, "utf8");
    const parsed = JSON.parse(raw) as FluxPoolSnapshot;
    if (
      typeof parsed.freeGenerationsRemaining !== "number" ||
      typeof parsed.freeGenerationsGranted !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeFluxPoolSnapshot(snapshot: FluxPoolSnapshot) {
  await ensureDataDir();
  await fs.writeFile(STUDIO_FLUX_POOL_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}
