import {
  EmailOutboxTemplate,
  MentorApplicationStatus,
  MentorApplicationTrack,
  type MentorApplication as DbMentorApplication,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/email/escape";
import { generateL2Token, hashL2Token, isL2TokenExpired, l2TokenExpiresAt } from "@/lib/mentor-program/l2-token";
import { enqueueApplicantEmail } from "@/lib/mentor-program/outbox";
import { assertTransition, isL2Editable } from "@/lib/mentor-program/status-machine";
import type { MentorApplicationRecord } from "@/lib/mentor-program/types";
import type { MentorL1ApplicationInput, MentorL2DraftInput } from "@/lib/validations/mentor-application";

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function mapApplication(row: DbMentorApplication): MentorApplicationRecord {
  return {
    id: row.id,
    track: row.track,
    status: row.status,
    email: row.email,
    fullName: row.fullName,
    l1Answers: asRecord(row.l1Answers) ?? {},
    l2Answers: asRecord(row.l2Answers),
    l2TokenExpiresAt: row.l2TokenExpiresAt?.toISOString() ?? null,
    hasL2Token: Boolean(row.l2TokenHash),
    adminNote: row.adminNote,
    legacyPayload: asRecord(row.legacyPayload),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function recordEvent(
  applicationId: string,
  fromStatus: MentorApplicationStatus | null,
  toStatus: MentorApplicationStatus,
  actorEmail: string,
  note?: string
) {
  await db.mentorApplicationStatusEvent.create({
    data: {
      applicationId,
      fromStatus: fromStatus ?? undefined,
      toStatus,
      actorEmail,
      note,
    },
  });
}

export async function createOpenL1Application(
  input: MentorL1ApplicationInput
): Promise<MentorApplicationRecord> {
  const { turnstileToken: _t, ...answers } = input;
  const row = await db.mentorApplication.create({
    data: {
      track: MentorApplicationTrack.OPEN,
      status: MentorApplicationStatus.SCREENING,
      email: answers.l1_email.toLowerCase(),
      fullName: answers.l1_full_name,
      l1Answers: answers as Prisma.InputJsonValue,
    },
  });
  await recordEvent(row.id, null, MentorApplicationStatus.SCREENING, answers.l1_email, "L1 submitted");
  await enqueueApplicantEmail({
    applicationId: row.id,
    to: row.email,
    template: EmailOutboxTemplate.APPLICATION_RECEIVED,
    payload: { fullName: row.fullName },
  });
  return mapApplication(row);
}

export async function listMentorApplications(status?: MentorApplicationStatus) {
  const rows = await db.mentorApplication.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapApplication);
}

export async function getMentorApplicationById(id: string) {
  const row = await db.mentorApplication.findUnique({ where: { id } });
  return row ? mapApplication(row) : undefined;
}

export async function getApplicationByL2Token(token: string) {
  const row = await db.mentorApplication.findUnique({
    where: { l2TokenHash: hashL2Token(token) },
  });
  if (!row) return undefined;
  if (isL2TokenExpired(row.l2TokenExpiresAt)) return undefined;
  return row;
}

export function l2PortalUrl(token: string) {
  return `${getSiteUrl().replace(/\/$/, "")}/jadi-mentor/lanjut/${token}`;
}

export async function issueL2Token(
  applicationId: string,
  actorEmail: string,
  note?: string
): Promise<{ application: MentorApplicationRecord; token: string; url: string }> {
  const current = await db.mentorApplication.findUnique({ where: { id: applicationId } });
  if (!current) throw new Error("Aplikasi tidak ditemukan.");

  const nextStatus =
    current.status === MentorApplicationStatus.L2_INVITED ||
    current.status === MentorApplicationStatus.L2_IN_PROGRESS
      ? current.status
      : MentorApplicationStatus.L2_INVITED;
  if (nextStatus !== current.status) {
    assertTransition(current.status, nextStatus);
  }

  const token = generateL2Token();
  const row = await db.mentorApplication.update({
    where: { id: applicationId },
    data: {
      status: nextStatus,
      l2TokenHash: hashL2Token(token),
      l2TokenExpiresAt: l2TokenExpiresAt(),
      adminNote: note ?? current.adminNote,
    },
  });
  if (nextStatus !== current.status) {
    await recordEvent(row.id, current.status, nextStatus, actorEmail, note);
  }
  await enqueueApplicantEmail({
    applicationId: row.id,
    to: row.email,
    template: EmailOutboxTemplate.APPLICATION_L2_INVITATION,
    payload: { fullName: row.fullName, url: l2PortalUrl(token) },
  });
  return { application: mapApplication(row), token, url: l2PortalUrl(token) };
}

export async function createDirectInvite(input: {
  fullName: string;
  email: string;
  note?: string;
  actorEmail: string;
}): Promise<{ application: MentorApplicationRecord; token: string; url: string }> {
  const token = generateL2Token();
  const email = input.email.toLowerCase();
  const row = await db.mentorApplication.create({
    data: {
      track: MentorApplicationTrack.DIRECT,
      status: MentorApplicationStatus.L2_INVITED,
      email,
      fullName: input.fullName,
      adminNote: input.note,
      l2TokenHash: hashL2Token(token),
      l2TokenExpiresAt: l2TokenExpiresAt(),
      l1Answers: {
        l1_full_name: input.fullName,
        l1_email: email,
        source: "direct",
      } as Prisma.InputJsonValue,
    },
  });
  await recordEvent(row.id, null, MentorApplicationStatus.L2_INVITED, input.actorEmail, input.note);
  await enqueueApplicantEmail({
    applicationId: row.id,
    to: row.email,
    template: EmailOutboxTemplate.APPLICATION_L2_INVITATION,
    payload: { fullName: row.fullName, url: l2PortalUrl(token) },
  });
  return { application: mapApplication(row), token, url: l2PortalUrl(token) };
}

export async function transitionApplication(input: {
  id: string;
  to: MentorApplicationStatus;
  actorEmail: string;
  note?: string;
}): Promise<MentorApplicationRecord> {
  const current = await db.mentorApplication.findUnique({ where: { id: input.id } });
  if (!current) throw new Error("Aplikasi tidak ditemukan.");
  assertTransition(current.status, input.to);

  const template: EmailOutboxTemplate | null =
    input.to === MentorApplicationStatus.REJECTED
      ? EmailOutboxTemplate.APPLICATION_REJECTED
      : input.to === MentorApplicationStatus.TALENT_POOL
        ? EmailOutboxTemplate.APPLICATION_TALENT_POOL
        : input.to === MentorApplicationStatus.INFO_REQUIRED
          ? EmailOutboxTemplate.APPLICATION_INFO_REQUIRED
          : null;

  const row = await db.mentorApplication.update({
    where: { id: input.id },
    data: {
      status: input.to,
      adminNote: input.note ?? current.adminNote,
    },
  });
  await recordEvent(row.id, current.status, input.to, input.actorEmail, input.note);
  if (template) {
    await enqueueApplicantEmail({
      applicationId: row.id,
      to: row.email,
      template,
      payload: { fullName: row.fullName, note: input.note ?? "" },
    });
  }
  return mapApplication(row);
}

export async function openL2Portal(token: string) {
  const row = await getApplicationByL2Token(token);
  if (!row) return undefined;

  if (row.status === MentorApplicationStatus.L2_INVITED) {
    assertTransition(row.status, MentorApplicationStatus.L2_IN_PROGRESS);
    const updated = await db.mentorApplication.update({
      where: { id: row.id },
      data: { status: MentorApplicationStatus.L2_IN_PROGRESS },
    });
    await recordEvent(
      updated.id,
      MentorApplicationStatus.L2_INVITED,
      MentorApplicationStatus.L2_IN_PROGRESS,
      row.email,
      "Opened L2 portal"
    );
    return { application: mapApplication(updated), readOnly: false as const };
  }

  return {
    application: mapApplication(row),
    readOnly: !isL2Editable(row.status) as boolean,
  };
}

export async function saveL2Draft(token: string, answers: MentorL2DraftInput) {
  const row = await getApplicationByL2Token(token);
  if (!row) throw new Error("Tautan tidak valid atau kedaluwarsa.");
  if (!isL2Editable(row.status)) {
    throw new Error("Aplikasi tahap 2 sudah dikunci.");
  }
  let status = row.status;
  if (status === MentorApplicationStatus.L2_INVITED) {
    assertTransition(status, MentorApplicationStatus.L2_IN_PROGRESS);
    status = MentorApplicationStatus.L2_IN_PROGRESS;
  }
  const updated = await db.mentorApplication.update({
    where: { id: row.id },
    data: {
      status,
      l2Answers: answers as Prisma.InputJsonValue,
    },
  });
  if (status !== row.status) {
    await recordEvent(updated.id, row.status, status, row.email, "L2 draft");
  }
  return mapApplication(updated);
}

export async function submitL2(token: string, answers: MentorL2DraftInput) {
  const row = await getApplicationByL2Token(token);
  if (!row) throw new Error("Tautan tidak valid atau kedaluwarsa.");
  if (!isL2Editable(row.status)) {
    throw new Error("Aplikasi tahap 2 sudah dikunci.");
  }
  assertTransition(row.status, MentorApplicationStatus.L2_SUBMITTED);
  const submitted = await db.mentorApplication.update({
    where: { id: row.id },
    data: {
      status: MentorApplicationStatus.L2_SUBMITTED,
      l2Answers: answers as Prisma.InputJsonValue,
    },
  });
  await recordEvent(
    submitted.id,
    row.status,
    MentorApplicationStatus.L2_SUBMITTED,
    row.email,
    "L2 submitted"
  );
  assertTransition(MentorApplicationStatus.L2_SUBMITTED, MentorApplicationStatus.REVIEW);
  const reviewed = await db.mentorApplication.update({
    where: { id: row.id },
    data: { status: MentorApplicationStatus.REVIEW },
  });
  await recordEvent(
    reviewed.id,
    MentorApplicationStatus.L2_SUBMITTED,
    MentorApplicationStatus.REVIEW,
    "system",
    "Auto-move to review"
  );
  return mapApplication(reviewed);
}
