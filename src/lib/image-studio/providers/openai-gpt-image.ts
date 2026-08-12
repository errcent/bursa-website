import OpenAI from "openai";

import { getProviderEnvKey } from "@/lib/image-studio/config";
import { applyPromptPreset } from "@/lib/image-studio/presets";
import type {
  CreditSnapshot,
  GenerateInput,
  GenerationResult,
  ImageQuality,
  StudioModel,
  LegacyStudioProvider,
} from "@/lib/image-studio/types";

const MODELS: StudioModel[] = [
  {
    id: "gpt-image-2",
    label: "GPT Image 2",
    description: "OpenAI - patuh brief kompleks, editing presisi",
    defaultCostUsd: 0.053,
  },
];

function qualityCostMultiplier(quality?: ImageQuality) {
  switch (quality) {
    case "low":
      return 0.12;
    case "high":
      return 4;
    default:
      return 1;
  }
}

function toOpenAiSize(width: number, height: number): "1024x1024" | "1024x1536" | "1536x1024" {
  const ratio = width / height;
  if (ratio > 1.2) return "1536x1024";
  if (ratio < 0.85) return "1024x1536";
  return "1024x1024";
}

function getClient() {
  const apiKey = getProviderEnvKey("openai");
  if (!apiKey) throw new Error("OPENAI_API_KEY belum dikonfigurasi");
  return new OpenAI({ apiKey });
}

export const openAiGptImageProvider: LegacyStudioProvider = {
  id: "openai",
  name: "OpenAI",
  freeTierNote: "Tidak ada free tier permanen - starter credit akun baru saja",
  models: MODELS,

  isConfigured() {
    return Boolean(getProviderEnvKey("openai"));
  },

  async getCredits(): Promise<CreditSnapshot> {
    if (!this.isConfigured()) {
      return { balance: null, unit: "usd", source: "none", message: "API key belum diset" };
    }
    return {
      balance: null,
      unit: "usd",
      source: "manual",
      message: "Set budget manual di pengaturan studio",
    };
  },

  estimateCost(modelId: string, width: number, height: number, quality?: ImageQuality) {
    const model = MODELS.find((item) => item.id === modelId);
    const base = model?.defaultCostUsd ?? 0.053;
    return base * qualityCostMultiplier(quality);
  },

  async generate(input: GenerateInput): Promise<GenerationResult> {
    const client = getClient();
    const prompt = applyPromptPreset(input.prompt, input.preset);
    const quality = input.quality ?? "medium";
    const size = toOpenAiSize(input.width, input.height);

    const response = await client.images.generate({
      model: "gpt-image-2",
      prompt,
      size,
      quality,
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData?.b64_json) {
      throw new Error("OpenAI tidak mengembalikan data gambar");
    }

    const imageBuffer = Buffer.from(imageData.b64_json, "base64");
    const costEstimate = this.estimateCost(input.modelId, input.width, input.height, quality);

    return {
      imageBuffer,
      mimeType: "image/png",
      costEstimate,
      creditsBefore: null,
      creditsAfter: null,
      creditsUsed: null,
      billingMode: "paid",
      isFree: false,
      seed: input.seed,
    };
  },
} as LegacyStudioProvider;
