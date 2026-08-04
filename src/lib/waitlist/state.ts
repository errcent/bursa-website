import type { WaitlistStatus } from "@prisma/client";

export interface DuplicateWaitlistTransition {
  shouldConfirm: boolean;
  shouldSendConfirmation: boolean;
  shouldSyncLifecycle: boolean;
  nextStatus: WaitlistStatus;
}

export function duplicateWaitlistTransition(
  status: WaitlistStatus,
  alreadyConfirmed: boolean
): DuplicateWaitlistTransition {
  const canReactivate = status === "UNSUBSCRIBED";
  const recoverLegacy = status === "ACTIVE" && !alreadyConfirmed;
  const shouldConfirm = recoverLegacy || canReactivate;

  return {
    shouldConfirm,
    shouldSendConfirmation: shouldConfirm,
    shouldSyncLifecycle: shouldConfirm,
    // Deliverability suppression and converted contacts are never reactivated by a duplicate form.
    nextStatus: canReactivate || status === "ACTIVE" ? "ACTIVE" : status,
  };
}

