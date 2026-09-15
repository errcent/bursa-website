import { defaultPlaybookState } from "@/lib/note/playbook/defaults";
import { defaultProfile, priorWeightsFromSignals } from "@/lib/note/playbook/profile";
import type { BehaviorSignals, PlaybookPersisted } from "@/lib/note/playbook/types";

const KEY = "note-playbook-v2";
const LEGACY_KEY = "note-playbook-v1";

function migrateV1(parsed: Record<string, unknown>): PlaybookPersisted {
  const base = defaultPlaybookState();
  return {
    ...base,
    activeSetupId: (parsed.activeSetupId as string | null) ?? base.activeSetupId,
    setups: Array.isArray(parsed.setups) && parsed.setups.length ? (parsed.setups as PlaybookPersisted["setups"]) : base.setups,
    checkAnswers: (parsed.checkAnswers as PlaybookPersisted["checkAnswers"]) ?? {},
    rules: { ...base.rules, ...(parsed.rules as object) },
    gateSession: base.gateSession,
  };
}

function normalizeProfile(raw: Partial<PlaybookPersisted["profile"]> | undefined): PlaybookPersisted["profile"] {
  const base = defaultProfile();
  if (!raw?.signals) return base;
  const signals = { ...base.signals, ...raw.signals } as BehaviorSignals;
  return {
    signals,
    weights: raw.weights ?? priorWeightsFromSignals(signals),
    updatedAt: raw.updatedAt ?? null,
    onboardingCompleted: raw.onboardingCompleted ?? true,
  };
}

export function loadPlaybook(): PlaybookPersisted {
  if (typeof window === "undefined") return defaultPlaybookState();
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return defaultPlaybookState();
    const parsed = JSON.parse(raw) as Partial<PlaybookPersisted> & { version?: number };
    if (parsed.version !== 2) {
      return migrateV1(parsed as Record<string, unknown>);
    }
    const base = defaultPlaybookState();
    return {
      version: 2,
      profile: normalizeProfile(parsed.profile),
      activeSetupId: parsed.activeSetupId ?? base.activeSetupId,
      setups: Array.isArray(parsed.setups) && parsed.setups.length ? parsed.setups : base.setups,
      checkAnswers: parsed.checkAnswers ?? {},
      rules: { ...base.rules, ...parsed.rules },
      gateSession: parsed.gateSession ?? base.gateSession,
    };
  } catch {
    return defaultPlaybookState();
  }
}

export function savePlaybook(state: PlaybookPersisted) {
  localStorage.setItem(KEY, JSON.stringify(state));
  localStorage.removeItem(LEGACY_KEY);
}
