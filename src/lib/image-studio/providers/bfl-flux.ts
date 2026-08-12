import { getProviderEnvKey, megapixelsFor } from "@/lib/image-studio/config";
import { readFluxPoolSnapshot } from "@/lib/image-studio/flux-pool";
import { applyPromptPreset } from "@/lib/image-studio/presets";
import { countBflFreeUsed } from "@/lib/image-studio/ledger";
import type {
  CreditSnapshot,
  GenerateInput,
  GenerationResult,
  ImageQuality,
  StudioModel,
  StudioProvider,
} from "@/lib/image-studio/types";

const BFL_BASE = "https://api.bfl.ai";

const MODELS: StudioModel[] = [
  {
    id: "flux-2-max",
    label: "FLUX.2 Max",
    description: "Kualitas tertinggi, fotorealisme terbaik",
    defaultCostUsd: 0.1,
    creditsPerImage: 10,
  },
  {
    id: "flux-2-pro-preview",
    label: "FLUX.2 Pro (preview)",
    description: "Balance kualitas & kecepatan",
    defaultCostUsd: 0.05,
    creditsPerImage: 5,
  },
  {
    id: "flux-2-flex",
    label: "FLUX.2 Flex",
    description: "Tipografi & detail kecil",
    defaultCostUsd: 0.04,
    creditsPerImage: 4,
  },
];

function endpointForModel(modelId: string) {
  switch (modelId) {
    case "flux-2-max":
      return "/v1/flux-2-max";
    case "flux-2-pro-preview":
      return "/v1/flux-2-pro-preview";
    case "flux-2-flex":
      return "/v1/flux-2-flex";
    default:
      throw new Error(`Model BFL tidak dikenal: ${modelId}`);
  }
}

async function bflFetch(path: string, init?: RequestInit) {
  const apiKey = getProviderEnvKey("bfl");
  if (!apiKey) throw new Error("BFL_API_KEY belum dikonfigurasi");

  const res = await fetch(`${BFL_BASE}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "x-key": apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`BFL API error ${res.status}: ${body.slice(0, 300)}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

async function pollBflResult(pollingUrl: string, apiKey: string, maxAttempts = 120) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const res = await fetch(pollingUrl, {
      headers: {
        accept: "application/json",
        "x-key": apiKey,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`BFL poll error ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      status?: string;
      result?: { sample?: string };
      error?: string;
    };

    if (data.status === "Ready" && data.result?.sample) {
      return data;
    }

    if (data.status === "Error" || data.status === "Failed") {
      throw new Error(data.error ?? "BFL generation failed");
    }
  }

  throw new Error("BFL generation timed out");
}

export async function resolveBflFreePool() {
  const snapshot = await readFluxPoolSnapshot();
  if (snapshot) {
    return {
      remaining: snapshot.freeGenerationsRemaining,
      granted: snapshot.freeGenerationsGranted,
      paidCredits: snapshot.paidCredits,
      source: "snapshot" as const,
    };
  }

  const granted = 20;
  const used = await countBflFreeUsed();
  return {
    remaining: Math.max(0, granted - used),
    granted,
    paidCredits: null,
    source: "ledger" as const,
  };
}

export const bflFluxProvider: StudioProvider = {
  id: "bfl",
  name: "Black Forest Labs",
  freeTierNote:
    "Pool gratis 20 = login BFL MCP di Cursor (bukan BFL_API_KEY). API key memakai saldo paid credits.",
  models: MODELS,

  isConfigured() {
    return Boolean(getProviderEnvKey("bfl"));
  },

  async getCredits(): Promise<CreditSnapshot> {
    if (!this.isConfigured()) {
      return {
        balance: null,
        unit: "generations",
        source: "none",
        message: "API key belum diset",
      };
    }

    const pool = await resolveBflFreePool();
    let paidCredits: number | null = pool.paidCredits;

    if (paidCredits === null) {
      try {
        const data = await bflFetch("/v1/credits");
        paidCredits = typeof data.credits === "number" ? data.credits : null;
      } catch {
        paidCredits = null;
      }
    }

    return {
      balance: pool.remaining,
      unit: "generations",
      source: pool.source === "snapshot" ? "snapshot" : "api",
      freeGenerationsRemaining: pool.remaining,
      freeGenerationsGranted: pool.granted,
      paidCredits,
      message:
        pool.remaining > 0
          ? `${pool.remaining} generate gratis tersisa`
          : "Pool gratis habis - pakai Pollinations atau top-up",
    };
  },

  estimateCost(modelId: string, width: number, height: number, _quality?: ImageQuality) {
    const credits = this.estimateCredits(modelId, width, height);
    return credits / 100;
  },

  estimateCredits(modelId: string, width: number, height: number) {
    const model = MODELS.find((item) => item.id === modelId);
    const mp = megapixelsFor(width, height);
    if (modelId === "flux-2-max") {
      if (mp <= 1) return 7;
      return 10;
    }
    return model?.creditsPerImage ?? 5;
  },

  async generate(input: GenerateInput): Promise<GenerationResult> {
    const apiKey = getProviderEnvKey("bfl");
    if (!apiKey) throw new Error("BFL_API_KEY belum dikonfigurasi");

    const pool = await resolveBflFreePool();
    const paidCredits = (await this.getCredits()).paidCredits ?? 0;

    if (paidCredits <= 0) {
      throw new Error(
        "Saldo paid credits BFL_API_KEY = 0. Pool gratis 20 hanya via BFL MCP di Cursor (login Gmail baru di MCP settings), bukan REST API key."
      );
    }

    const paidBefore = paidCredits;
    const prompt = applyPromptPreset(input.prompt, input.preset);
    const endpoint = endpointForModel(input.modelId);
    const megapixels = megapixelsFor(input.width, input.height);

    const submit = await bflFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        prompt,
        width: input.width,
        height: input.height,
        seed: input.seed,
        output_format: "jpeg",
        safety_tolerance: 3,
      }),
    });

    const pollingUrl = typeof submit.polling_url === "string" ? submit.polling_url : null;
    if (!pollingUrl) throw new Error("BFL tidak mengembalikan polling_url");

    const result = await pollBflResult(pollingUrl, apiKey);
    const sampleUrl = result.result?.sample;
    if (!sampleUrl) throw new Error("BFL tidak mengembalikan URL gambar");

    const imageRes = await fetch(sampleUrl);
    if (!imageRes.ok) throw new Error("Gagal mengunduh gambar dari BFL");

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const creditsUsed =
      typeof submit.cost === "number" ? submit.cost : this.estimateCredits(input.modelId, input.width, input.height);
    const costEstimate = creditsUsed / 100;

    const usedFreePool = pool.remaining > 0;
    const billingMode = usedFreePool ? "free" : "paid";
    const paidAfter =
      paidBefore !== null && !usedFreePool ? Math.max(0, paidBefore - creditsUsed) : paidBefore;

    return {
      imageBuffer,
      mimeType: "image/jpeg",
      costEstimate,
      creditsBefore: usedFreePool ? pool.remaining : paidBefore,
      creditsAfter: usedFreePool ? Math.max(0, pool.remaining - 1) : paidAfter,
      creditsUsed,
      billingMode,
      isFree: billingMode === "free",
      megapixels,
      seed: input.seed,
      providerMeta: { taskId: submit.id, usedFreePool },
    };
  },
};
