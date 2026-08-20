import type { MentorApplicationStatus, MentorApplicationTrack } from "@prisma/client";

export interface MentorApplicationRecord {
  id: string;
  track: MentorApplicationTrack;
  status: MentorApplicationStatus;
  email: string;
  fullName: string;
  l1Answers: Record<string, unknown>;
  l2Answers: Record<string, unknown> | null;
  l2TokenExpiresAt: string | null;
  hasL2Token: boolean;
  adminNote: string | null;
  legacyPayload: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
