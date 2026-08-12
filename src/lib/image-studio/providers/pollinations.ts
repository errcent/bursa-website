import { megapixelsFor } from "@/lib/image-studio/config";
import { applyPromptPreset } from "@/lib/image-studio/presets";
import type {
  CreditSnapshot,
  GenerateInput,
  GenerationResult,
  ImageQuality,
  StudioModel,
  StudioProvider,
} from "@/lib/image-studio/types";

const MODELS: StudioModel[] = [
  {
    id: "flux",
    label: "FLUX",
    description: "Photorealistic, versatile - gratis via Pollinations",
    defaultCostUsd: 0,
    creditsPerImage: 0,
  },
  {
    id: "zimage",
    label: "Z-Image",
    description: "Artistic stylized - gratis via Pollinations",
    defaultCostUsd: 0,
    creditsPerImage: 0,
  },
];

function pollinationsUrl(prompt: string, model: string, width: number, height: number, seed?: number) {
  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    nologo: "true",
  });
  if (seed !== undefined) params.set("seed", String(seed));
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (apiKey) params.set("key", apiKey);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

export const pollinationsProvider: StudioProvider = {
  id: "pollinations",
  name: "Pollinations",
  freeTierNote: "Gratis tanpa API key - rate limit ~1 req/15s (anonymous)",
  models: MODELS,

  isConfigured() {
    return true;
  },

  async getCredits(): Promise<CreditSnapshot> {
    return {
      balance: null,
      unit: "generations",
      source: "none",
      message: "Gratis dengan rate limit - tidak ada saldo resmi",
      freeGenerationsRemaining: null,
      freeGenerationsGranted: null,
      paidCredits: 0,
    };
  },

  estimateCost() {
    return 0;
  },

  estimateCredits() {
    return 0;
  },

  async generate(input: GenerateInput): Promise<GenerationResult> {
    const prompt = applyPromptPreset(input.prompt, input.preset);
    const url = pollinationsUrl(prompt, input.modelId, input.width, input.height, input.seed);

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Pollinations error ${res.status}: ${body.slice(0, 200)}`);
    }

    const imageBuffer = Buffer.from(await res.arrayBuffer());
    const megapixels = megapixelsFor(input.width, input.height);

    return {
      imageBuffer,
      mimeType: res.headers.get("content-type") ?? "image/jpeg",
      costEstimate: 0,
      creditsBefore: null,
      creditsAfter: null,
      creditsUsed: 0,
      billingMode: "free",
      isFree: true,
      megapixels,
      seed: input.seed,
      providerMeta: { endpoint: "image.pollinations.ai" },
    };
  },
};
