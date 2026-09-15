import { priorWeightsFromSignals } from "@/lib/note/playbook/profile";
import type { PlaybookPersisted } from "@/lib/note/playbook/types";
import type { PlaybookSuggestion } from "@/lib/note/analytics/types";

export function applyPlaybookSuggestion(
  state: PlaybookPersisted,
  suggestion: PlaybookSuggestion
): PlaybookPersisted {
  const signals = suggestion.patch.signal
    ? { ...state.profile.signals, ...suggestion.patch.signal }
    : state.profile.signals;
  const rules = suggestion.patch.rules ? { ...state.rules, ...suggestion.patch.rules } : state.rules;
  return {
    ...state,
    rules,
    profile: {
      ...state.profile,
      signals,
      weights: priorWeightsFromSignals(signals),
      updatedAt: new Date().toISOString(),
    },
  };
}
