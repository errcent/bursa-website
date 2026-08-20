import type { MentorApplicationStatus } from "@prisma/client";

const NEXT: Record<MentorApplicationStatus, readonly MentorApplicationStatus[]> = {
  SUBMITTED: ["SCREENING"],
  SCREENING: ["L2_INVITED", "REJECTED", "TALENT_POOL", "INFO_REQUIRED"],
  INFO_REQUIRED: ["SCREENING", "L2_INVITED", "REJECTED", "TALENT_POOL"],
  DIRECT_INVITED: ["L2_INVITED", "L2_IN_PROGRESS", "REJECTED"],
  L2_INVITED: ["L2_IN_PROGRESS", "L2_SUBMITTED", "SCREENING", "REJECTED", "TALENT_POOL"],
  L2_IN_PROGRESS: ["L2_SUBMITTED", "L2_INVITED", "REJECTED", "TALENT_POOL"],
  L2_SUBMITTED: ["REVIEW"],
  REVIEW: [
    "ASSESSMENT",
    "FINAL_REVIEW",
    "APPROVED",
    "REJECTED",
    "TALENT_POOL",
    "REVISION_REQUIRED",
    "INFO_REQUIRED",
  ],
  ASSESSMENT: ["FINAL_REVIEW", "APPROVED", "REJECTED", "TALENT_POOL", "REVISION_REQUIRED"],
  FINAL_REVIEW: ["APPROVED", "REJECTED", "TALENT_POOL", "REVISION_REQUIRED"],
  REVISION_REQUIRED: ["L2_IN_PROGRESS", "L2_SUBMITTED", "REJECTED", "TALENT_POOL"],
  APPROVED: ["ONBOARDING", "REJECTED"],
  ONBOARDING: ["PRODUCTION_READY"],
  PRODUCTION_READY: [],
  REJECTED: ["TALENT_POOL", "SCREENING", "L2_INVITED"],
  TALENT_POOL: ["L2_INVITED", "SCREENING", "REJECTED"],
};

export function canTransition(
  from: MentorApplicationStatus,
  to: MentorApplicationStatus
): boolean {
  if (from === to) return true;
  return NEXT[from].includes(to);
}

export function assertTransition(
  from: MentorApplicationStatus,
  to: MentorApplicationStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transisi status tidak diizinkan: ${from} → ${to}`);
  }
}

export const APPLICANT_L2_EDITABLE: MentorApplicationStatus[] = [
  "L2_INVITED",
  "L2_IN_PROGRESS",
  "REVISION_REQUIRED",
];

export function isL2Editable(status: MentorApplicationStatus): boolean {
  return APPLICANT_L2_EDITABLE.includes(status);
}
