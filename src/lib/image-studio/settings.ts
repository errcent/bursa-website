import { promises as fs } from "node:fs";

import { STUDIO_DATA_DIR, STUDIO_SETTINGS_PATH } from "@/lib/image-studio/config";
import type { StudioSettings } from "@/lib/image-studio/types";

const DEFAULT_SETTINGS: StudioSettings = {
  openaiBudgetUsd: null,
  googleBudgetUsd: null,
};

async function ensureDataDir() {
  await fs.mkdir(STUDIO_DATA_DIR, { recursive: true });
}

export async function readStudioSettings(): Promise<StudioSettings> {
  try {
    const raw = await fs.readFile(STUDIO_SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    return {
      openaiBudgetUsd:
        typeof parsed.openaiBudgetUsd === "number" ? parsed.openaiBudgetUsd : null,
      googleBudgetUsd:
        typeof parsed.googleBudgetUsd === "number" ? parsed.googleBudgetUsd : null,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeStudioSettings(patch: Partial<StudioSettings>) {
  await ensureDataDir();
  const current = await readStudioSettings();
  const next: StudioSettings = {
    openaiBudgetUsd:
      patch.openaiBudgetUsd !== undefined ? patch.openaiBudgetUsd : current.openaiBudgetUsd,
    googleBudgetUsd:
      patch.googleBudgetUsd !== undefined ? patch.googleBudgetUsd : current.googleBudgetUsd,
  };
  await fs.writeFile(STUDIO_SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
