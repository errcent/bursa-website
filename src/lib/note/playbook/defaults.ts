import { defaultProfile } from "@/lib/note/playbook/profile";
import type { PlaybookCheckDef, PlaybookPersisted, PlaybookSetup } from "@/lib/note/playbook/types";

export const PLAYBOOK_CHECKS: PlaybookCheckDef[] = [
  {
    id: "trend_clear",
    label: { id: "Trend jelas?", en: "Trend clear?" },
    critical: true,
  },
  {
    id: "liquidity_valid",
    label: { id: "Liquidity valid?", en: "Liquidity valid?" },
  },
  {
    id: "session_active",
    label: { id: "Session aktif?", en: "Session active?" },
  },
  {
    id: "news_safe",
    label: { id: "News aman?", en: "News safe?" },
    critical: true,
  },
  {
    id: "setup_match",
    label: { id: "Opportunity match setup aktif?", en: "Opportunity matches active setup?" },
    critical: true,
  },
  {
    id: "no_overexposure",
    label: { id: "Risk/size sudah didefinisikan?", en: "Risk/size defined?" },
  },
  {
    id: "invalidation_intact",
    label: { id: "Invalidation belum kena?", en: "Invalidation intact?" },
  },
  {
    id: "structure_confirmed",
    label: { id: "Struktur double-check?", en: "Structure double-check?" },
  },
];

/** Stable id for the blank first setup (tests + fresh installs). */
export const DEFAULT_SETUP_ID = "primary";

/** Optional catalog - user adds explicitly; never forced as defaults. */
export const PLAYBOOK_SETUP_TEMPLATES: PlaybookSetup[] = [
  {
    id: "tpl-ict",
    name: "ICT-style",
    condition: {
      id: "Sweep + displacement, entry di zona OB/FVG yang kamu definisi.",
      en: "Sweep + displacement, entry at OB/FVG zones you define.",
    },
    confidence: "med",
    enabled: true,
  },
  {
    id: "tpl-breakout",
    name: "Breakout",
    condition: {
      id: "Close di luar range dengan konfirmasi volume/volatilitas kamu.",
      en: "Close outside range with your volume/volatility confirmation.",
    },
    confidence: "high",
    enabled: true,
  },
  {
    id: "tpl-trend",
    name: "Trend follow",
    condition: {
      id: "Pullback ke struktur searah trend timeframe utama kamu.",
      en: "Pullback to structure aligned with your main timeframe trend.",
    },
    confidence: "high",
    enabled: true,
  },
  {
    id: "tpl-mean-revert",
    name: "Mean revert",
    condition: {
      id: "Ekstrem + rejection di batas range yang kamu ukur.",
      en: "Extreme + rejection at a range edge you measure.",
    },
    confidence: "low",
    enabled: true,
  },
  {
    id: "tpl-scalp",
    name: "Scalp / session",
    condition: {
      id: "Setup intraday di sesi likuiditas pilihanmu.",
      en: "Intraday setup in your chosen liquidity session.",
    },
    confidence: "med",
    enabled: true,
  },
];

export const DEFAULT_SETUPS: PlaybookSetup[] = [
  {
    id: DEFAULT_SETUP_ID,
    name: "Setup 1",
    condition: {
      id: "Tulis kapan setup ini valid - gaya trade kamu sendiri.",
      en: "Describe when this setup is valid - your own style.",
    },
    confidence: "med",
    enabled: true,
  },
];

export const DEFAULT_RULES: PlaybookPersisted["rules"] = {
  maxRiskPerTradePct: 1,
  maxDailyLoss: 100,
  maxTradesPerSession: 3,
  blockMinutesBeforeHighImpact: 30,
  stopAfterConsecutiveLosses: 3,
  cooldownMinutesAfterLoss: 0,
};

export function defaultPlaybookState(): PlaybookPersisted {
  return {
    version: 2,
    profile: defaultProfile(),
    activeSetupId: DEFAULT_SETUP_ID,
    setups: DEFAULT_SETUPS.map((s) => ({ ...s })),
    checkAnswers: {},
    rules: { ...DEFAULT_RULES },
    gateSession: { lastLossOpenedAt: null, checkPassesSinceLoss: 0 },
  };
}
