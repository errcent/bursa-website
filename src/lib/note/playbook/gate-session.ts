import type { PlaybookPersisted } from "@/lib/note/playbook/types";

export function syncGateSessionAfterLoss(
  state: PlaybookPersisted,
  lastLossIso: string | null
): PlaybookPersisted {
  const prev = state.gateSession?.lastLossOpenedAt ?? null;
  if (!lastLossIso) return state;
  if (prev === lastLossIso) return state;
  return {
    ...state,
    gateSession: {
      lastLossOpenedAt: lastLossIso,
      checkPassesSinceLoss: 0,
    },
  };
}

export function recordSuccessfulCheckCycle(state: PlaybookPersisted): PlaybookPersisted {
  const gs = state.gateSession ?? { lastLossOpenedAt: null, checkPassesSinceLoss: 0 };
  return {
    ...state,
    gateSession: {
      ...gs,
      checkPassesSinceLoss: gs.checkPassesSinceLoss + 1,
    },
  };
}
