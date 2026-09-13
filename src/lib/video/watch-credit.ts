/** Client + server: fair watch-time credit (no skip-to-end abuse; 2x speed ok). */

export const HEARTBEAT_MAX_CREDIT_SECONDS = 120;
export const WATCH_COMPLETION_RATIO = 0.8;
const MAX_CREDITED_SPEED = 3;

export interface HeartbeatCreditInput {
  previousVerified: number;
  previousPosition: number;
  lastHeartbeatAt: Date | null;
  position: number;
  durationSeconds: number;
  now?: Date;
}

export interface HeartbeatCredit {
  verifiedWatchedSeconds: number;
  heartbeatPosition: number;
}

export function computeHeartbeatCredit(input: HeartbeatCreditInput): HeartbeatCredit {
  const now = input.now ?? new Date();
  const safePosition = Number.isFinite(input.position) ? Math.max(0, input.position) : 0;
  const positionAdvance = Math.max(0, safePosition - input.previousPosition);

  let credit = positionAdvance;
  if (input.lastHeartbeatAt) {
    const wallClockSeconds = Math.max(
      0,
      (now.getTime() - input.lastHeartbeatAt.getTime()) / 1000
    );
    credit = Math.min(credit, wallClockSeconds * MAX_CREDITED_SPEED);
  } else {
    credit = 0;
  }
  credit = Math.min(credit, HEARTBEAT_MAX_CREDIT_SECONDS);

  const duration = input.durationSeconds > 0 ? input.durationSeconds : Number.MAX_SAFE_INTEGER;
  const verifiedWatchedSeconds = Math.min(
    duration,
    Math.round(input.previousVerified + credit)
  );

  return {
    verifiedWatchedSeconds,
    heartbeatPosition: Math.round(safePosition),
  };
}

export function watchCompletionThresholdSeconds(durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.floor(durationSeconds * WATCH_COMPLETION_RATIO);
}
