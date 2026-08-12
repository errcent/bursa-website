import path from "node:path";

import type { LegacyStudioProviderId } from "@/lib/image-studio/types";

export function isImageStudioEnabled() {
  return (
    process.env.NODE_ENV === "development" || process.env.IMAGE_STUDIO_ENABLED === "true"
  );
}

export const STUDIO_DATA_DIR = path.join(process.cwd(), ".data", "image-studio");
export const STUDIO_IMAGES_DIR = path.join(STUDIO_DATA_DIR, "images");
export const STUDIO_LEDGER_PATH = path.join(STUDIO_DATA_DIR, "ledger.json");
export const STUDIO_FLUX_POOL_PATH = path.join(STUDIO_DATA_DIR, "flux-pool.json");
export const STUDIO_SETTINGS_PATH = path.join(STUDIO_DATA_DIR, "settings.json");

export function getProviderEnvKey(providerId: "bfl" | LegacyStudioProviderId) {
  switch (providerId) {
    case "bfl":
      return process.env.BFL_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "google":
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  }
}

export function megapixelsFor(width: number, height: number) {
  return Math.round(((width * height) / 1_000_000) * 100) / 100;
}
