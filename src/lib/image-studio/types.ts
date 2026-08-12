export type StudioProviderId = "bfl" | "pollinations";
export type LegacyStudioProviderId = "openai" | "google";

export type LedgerSource = "studio" | "mcp" | "seed";
export type BillingMode = "free" | "paid";

export type ImageQuality = "low" | "medium" | "high";

export type PromptPresetId = "portrait" | "still-life" | "custom";

export type StudioModel = {
  id: string;
  label: string;
  description?: string;
  defaultCostUsd: number;
  creditsPerImage?: number;
};

export type CreditSnapshot = {
  balance: number | null;
  unit: "credits" | "usd" | "generations";
  source: "api" | "manual" | "none" | "snapshot";
  message?: string;
  freeGenerationsRemaining?: number | null;
  freeGenerationsGranted?: number | null;
  paidCredits?: number | null;
};

export type FluxPoolSnapshot = {
  syncedAt: string;
  freeGenerationsRemaining: number;
  freeGenerationsGranted: number;
  paidCredits: number | null;
  source: "mcp" | "api";
};

export type GenerateInput = {
  providerId: StudioProviderId;
  modelId: string;
  prompt: string;
  width: number;
  height: number;
  quality?: ImageQuality;
  seed?: number;
  preset?: PromptPresetId;
};

export type GenerationResult = {
  imageBuffer: Buffer;
  mimeType: string;
  costEstimate: number;
  creditsBefore: number | null;
  creditsAfter: number | null;
  creditsUsed: number | null;
  billingMode: BillingMode;
  isFree: boolean;
  megapixels?: number;
  seed?: number;
  providerMeta?: Record<string, unknown>;
};

export type LedgerEntry = {
  id: string;
  provider: StudioProviderId;
  model: string;
  prompt: string;
  preset?: PromptPresetId;
  width: number;
  height: number;
  quality?: ImageQuality;
  seed?: number;
  costEstimate: number;
  creditsBefore: number | null;
  creditsAfter: number | null;
  creditsUsed: number | null;
  billingMode: BillingMode;
  isFree: boolean;
  source: LedgerSource;
  requestId?: string;
  megapixels?: number;
  imageUrl?: string;
  note?: string;
  filePath: string;
  status: "success" | "failed";
  error?: string;
  createdAt: string;
};

export type ProviderStats = {
  providerId: StudioProviderId;
  totalGenerated: number;
  generatedToday: number;
  totalCostEstimate: number;
  costToday: number;
  freeGenerated: number;
  paidGenerated: number;
};

export type UsageSummary = {
  totalEntries: number;
  freeGenerated: number;
  paidGenerated: number;
  totalCreditsUsed: number;
  bflFreeUsed: number;
};

export type ProviderStatus = {
  id: StudioProviderId;
  name: string;
  configured: boolean;
  freeTierNote: string;
  models: StudioModel[];
  credits: CreditSnapshot;
  stats: ProviderStats;
  estimatedRemainingImages: number | null;
  lastModelCostUsd: number | null;
  freeGenerationsRemaining: number | null;
  freeGenerationsGranted: number | null;
};

export type StudioStatusResponse = {
  providers: ProviderStatus[];
  fluxPool: FluxPoolSnapshot | null;
  summary: UsageSummary;
};

export type StudioSettings = {
  openaiBudgetUsd: number | null;
  googleBudgetUsd: number | null;
};

export interface StudioProvider {
  id: StudioProviderId;
  name: string;
  freeTierNote: string;
  models: StudioModel[];
  isConfigured(): boolean;
  getCredits(): Promise<CreditSnapshot>;
  estimateCost(modelId: string, width: number, height: number, quality?: ImageQuality): number;
  estimateCredits(modelId: string, width: number, height: number): number;
  generate(input: GenerateInput): Promise<GenerationResult>;
}

export interface LegacyStudioProvider extends Omit<StudioProvider, "id"> {
  id: LegacyStudioProviderId;
}
