export type SetupConfidence = "high" | "med" | "low";

export type PlaybookSetup = {
  id: string;
  name: string;
  condition: Record<"id" | "en", string>;
  confidence: SetupConfidence;
  enabled: boolean;
};

export type PlaybookCheckId =
  | "trend_clear"
  | "liquidity_valid"
  | "session_active"
  | "news_safe"
  | "setup_match"
  | "no_overexposure"
  | "invalidation_intact"
  | "structure_confirmed";

export type PlaybookCheckDef = {
  id: PlaybookCheckId;
  label: Record<"id" | "en", string>;
  /** Always required even in relaxed check mode. */
  critical?: boolean;
};

export type PlaybookRulesConfig = {
  maxRiskPerTradePct: number;
  maxDailyLoss: number;
  maxTradesPerSession: number;
  blockMinutesBeforeHighImpact: number;
  stopAfterConsecutiveLosses: number;
  /** Minutes to wait after a loss before new entry (0 = off). */
  cooldownMinutesAfterLoss: number;
};

export type TradeFrequencySignal = "low" | "medium" | "high";
export type LossResponseSignal = "stable" | "revenge" | "overcorrect";
export type EntryDisciplineSignal = "strict" | "mixed" | "impulsive";
export type ConfidenceShiftSignal = "stable" | "overconfident" | "underconfident";

export type BehaviorSignals = {
  tradeFrequency: TradeFrequencySignal;
  lossResponse: LossResponseSignal;
  entryDiscipline: EntryDisciplineSignal;
  confidenceShift: ConfidenceShiftSignal;
};

/** Internal belief weights (0..1). Not shown as user labels. */
export type BehaviorRiskWeights = {
  overtradeRisk: number;
  revengeRisk: number;
  impulseRisk: number;
  hesitation: number;
};

export type PlaybookProfile = {
  signals: BehaviorSignals;
  /** Posterior after journal updates. */
  weights: BehaviorRiskWeights;
  updatedAt: string | null;
  onboardingCompleted: boolean;
};

export type PlaybookGateSession = {
  lastLossOpenedAt: string | null;
  checkPassesSinceLoss: number;
};

export type PlaybookPersisted = {
  version: 2;
  profile: PlaybookProfile;
  activeSetupId: string | null;
  setups: PlaybookSetup[];
  checkAnswers: Partial<Record<PlaybookCheckId, boolean>>;
  /** User baseline caps; effective limits = adapt(base, weights). */
  rules: PlaybookRulesConfig;
  gateSession: PlaybookGateSession;
};

export type GateVerdict = "allow" | "conditional" | "block";

export type JournalGateMetrics = {
  tradesToday: number;
  dailyPnl: number;
  openCount: number;
  consecutiveLosses: number;
  tradesLast7Days: number;
  reentryAfterLossCount: number;
  winStreak: number;
};

export type AdaptedPlaybook = {
  rules: PlaybookRulesConfig;
  activeCheckIds: PlaybookCheckId[];
  minChecksRequired: number;
  intensity: "strict" | "balanced" | "relaxed";
};

export type PlaybookGateResult = {
  allowed: boolean;
  verdict: GateVerdict;
  setupSelected: boolean;
  checksComplete: boolean;
  checksPass: boolean;
  rulesPass: boolean;
  blockers: Record<"id" | "en", string>[];
  warnings: Record<"id" | "en", string>[];
  adapted: AdaptedPlaybook;
  requiredYes: number;
  coreYes: number;
  sizeScaleHint: number;
};
