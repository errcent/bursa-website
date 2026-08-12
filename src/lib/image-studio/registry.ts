import { readFluxPoolSnapshot } from "@/lib/image-studio/flux-pool";
import { buildUsageSummary, getAllProviderStats } from "@/lib/image-studio/ledger";
import { mergeSeedIfEmpty } from "@/lib/image-studio/import-seed";
import { bflFluxProvider, resolveBflFreePool } from "@/lib/image-studio/providers/bfl-flux";
import { pollinationsProvider } from "@/lib/image-studio/providers/pollinations";
import type {
  ImageQuality,
  ProviderStatus,
  StudioProvider,
  StudioProviderId,
} from "@/lib/image-studio/types";

const PROVIDERS: StudioProvider[] = [bflFluxProvider, pollinationsProvider];

export function getStudioProviders() {
  return PROVIDERS;
}

export function getStudioProvider(id: StudioProviderId) {
  const provider = PROVIDERS.find((item) => item.id === id);
  if (!provider) throw new Error(`Provider tidak dikenal: ${id}`);
  return provider;
}

function estimateRemaining(
  provider: StudioProvider,
  credits: {
    freeGenerationsRemaining?: number | null;
    paidCredits?: number | null;
  },
  lastModelCredits: number | null
) {
  if (provider.id === "bfl") {
    const freeRemaining = credits.freeGenerationsRemaining ?? 0;
    if (freeRemaining > 0) return freeRemaining;

    if (credits.paidCredits && lastModelCredits && lastModelCredits > 0) {
      return Math.floor(credits.paidCredits / lastModelCredits);
    }
    return 0;
  }

  if (provider.id === "pollinations") {
    return null;
  }

  return null;
}

export async function buildProviderStatuses(
  defaultModelCosts?: Partial<Record<StudioProviderId, { modelId: string; quality?: ImageQuality }>>
): Promise<ProviderStatus[]> {
  await mergeSeedIfEmpty();
  const statsMap = await getAllProviderStats();

  return Promise.all(
    PROVIDERS.map(async (provider) => {
      const stats = statsMap[provider.id];
      const credits = await provider.getCredits();
      const defaultModel = provider.models[0];
      const selection = defaultModelCosts?.[provider.id];
      const modelId = selection?.modelId ?? defaultModel?.id ?? provider.models[0]?.id ?? "";
      const lastModelCostUsd = modelId
        ? provider.estimateCost(modelId, 1280, 720, selection?.quality)
        : null;
      const lastModelCredits = modelId ? provider.estimateCredits(modelId, 1280, 720) : null;

      return {
        id: provider.id,
        name: provider.name,
        configured: provider.isConfigured(),
        freeTierNote: provider.freeTierNote,
        models: provider.models,
        credits,
        stats,
        estimatedRemainingImages: estimateRemaining(provider, credits, lastModelCredits),
        lastModelCostUsd,
        freeGenerationsRemaining: credits.freeGenerationsRemaining ?? null,
        freeGenerationsGranted: credits.freeGenerationsGranted ?? null,
      } satisfies ProviderStatus;
    })
  );
}

export async function buildStudioStatus() {
  await mergeSeedIfEmpty();
  const [providers, fluxPool, entries] = await Promise.all([
    buildProviderStatuses(),
    readFluxPoolSnapshot(),
    import("@/lib/image-studio/ledger").then((m) => m.readLedgerEntries()),
  ]);

  const pool = await resolveBflFreePool();
  const summary = buildUsageSummary(entries);

  return {
    providers,
    fluxPool:
      fluxPool ??
      ({
        syncedAt: new Date().toISOString(),
        freeGenerationsRemaining: pool.remaining,
        freeGenerationsGranted: pool.granted,
        paidCredits: pool.paidCredits,
        source: pool.source === "snapshot" ? "mcp" : "api",
      } as const),
    summary,
  };
}
