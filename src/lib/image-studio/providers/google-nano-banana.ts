import { GoogleGenerativeAI } from "@google/generative-ai";

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

const MODEL_ID = "gemini-3.1-flash-image-preview";

const MODELS: StudioModel[] = [
  {
    id: MODEL_ID,
    label: "Nano Banana 2",
    description: "Gemini 3.1 Flash Image - cepat, pro-level",
    defaultCostUsd: 0.067,
  },
];

function resolutionCost(width: number, height: number) {
  const mp = (width * height) / 1_000_000;
  if (mp <= 0.35) return 0.045;
  if (mp <= 1.1) return 0.067;
  if (mp <= 4.5) return 0.101;
  return 0.151;
}

function getClient() {
  const apiKey = getProviderEnvKey("google");
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY belum dikonfigurasi");
  return new GoogleGenerativeAI(apiKey);
}

export const googleNanoBananaProvider: LegacyStudioProvider = {
  id: "google",
  name: "Google Gemini",
  freeTierNote: "API berbayar - Gemini app free, bukan API",
  models: MODELS,

  isConfigured() {
    return Boolean(getProviderEnvKey("google"));
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

  estimateCost(_modelId: string, width: number, height: number, _quality?: ImageQuality) {
    return resolutionCost(width, height);
  },

  async generate(input: GenerateInput): Promise<GenerationResult> {
    const genAI = getClient();
    const prompt = applyPromptPreset(input.prompt, input.preset);

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        // @ts-expect-error - image response modality for Gemini image models
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nGenerate one photorealistic image at ${input.width}x${input.height} pixels.`,
            },
          ],
        },
      ],
    });

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => "inlineData" in part && part.inlineData?.data);

    if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData?.data) {
      const text = result.response.text();
      throw new Error(text ? `Gemini: ${text.slice(0, 200)}` : "Gemini tidak mengembalikan gambar");
    }

    const mimeType = imagePart.inlineData.mimeType ?? "image/png";
    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    const costEstimate = this.estimateCost(input.modelId, input.width, input.height);

    return {
      imageBuffer,
      mimeType,
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
