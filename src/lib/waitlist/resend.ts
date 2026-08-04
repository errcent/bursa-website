import { WaitlistEmailEventType, WaitlistSyncStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { getResendManagementClient } from "@/lib/email/client";
import { getSiteUrl } from "@/lib/email/escape";
import {
  isWithinWaitlistFrequencyCap,
  isWaitlistLifecycleEligible,
  isWaitlistLifecycleEnabled,
  WAITLIST_AUTOMATION_EVENT,
} from "@/lib/waitlist/config";
import {
  getWaitlistPreferencesUrl,
  getWaitlistUnsubscribeUrl,
} from "@/lib/waitlist/preferences";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Kesalahan Resend tidak diketahui.";
}

export async function syncWaitlistLifecycle(entryId: string): Promise<boolean> {
  if (!isWaitlistLifecycleEnabled()) return false;

  const resend = getResendManagementClient();
  if (!resend) return false;

  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.status !== "ACTIVE") return false;
  if (!isWaitlistLifecycleEligible(entry.id, entry.email)) return false;
  if (entry.automationEnrolledAt) {
    return entry.resendSyncStatus === WaitlistSyncStatus.SYNCED
      ? true
      : syncWaitlistPreferences(entry.id);
  }

  const claimedAt = new Date();
  const claim = await db.waitlistEntry.updateMany({
    where: { id: entry.id, automationEnrolledAt: null, status: "ACTIVE" },
    data: { automationEnrolledAt: claimedAt, resendSyncStatus: WaitlistSyncStatus.PENDING },
  });
  if (claim.count !== 1) return false;

  let definitiveFailure = false;
  try {
    const { error } = await resend.events.send({
      event: WAITLIST_AUTOMATION_EVENT,
      email: entry.email,
      payload: {
        entryId: entry.id,
        source: entry.source ?? "waitlist-page",
        language: entry.language,
        experienceLevel: entry.experienceLevel ?? "unknown",
        learningGoal: entry.learningGoal ?? "unknown",
        marketInterest: entry.marketInterest ?? "unknown",
        wantsProductUpdates: entry.wantsProductUpdates,
        wantsEducation: entry.wantsEducation,
        wantsLaunchNews: entry.wantsLaunchNews,
        referralCode: entry.referralCode,
        siteUrl: getSiteUrl(),
        preferencesUrl: getWaitlistPreferencesUrl(entry.id),
        unsubscribeUrl: getWaitlistUnsubscribeUrl(entry.id),
      },
    });

    if (error) {
      definitiveFailure = true;
      throw new Error(error.message);
    }

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        resendSyncStatus: WaitlistSyncStatus.SYNCED,
        resendSyncError: null,
        lastSyncedAt: new Date(),
        lifecycleStage: "NURTURE",
      },
    });
    return syncWaitlistPreferences(entry.id);
  } catch (error) {
    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        resendSyncStatus: WaitlistSyncStatus.FAILED,
        resendSyncError: definitiveFailure
          ? errorMessage(error)
          : `Status provider tidak pasti; cek Resend sebelum retry manual: ${errorMessage(error)}`,
        ...(definitiveFailure ? { automationEnrolledAt: null } : {}),
      },
    });
    console.error("[waitlist] lifecycle sync failed", {
      entryId: entry.id,
      error: errorMessage(error),
    });
    return false;
  }
}

export async function syncWaitlistPreferences(entryId: string): Promise<boolean> {
  const resend = getResendManagementClient();
  if (!resend) return false;

  const entry = await db.waitlistEntry.findUnique({ where: { id: entryId } });
  if (!entry) return false;

  try {
    const topicDefinitions = [
      [process.env.RESEND_TOPIC_PRODUCT_ID, entry.wantsProductUpdates],
      [process.env.RESEND_TOPIC_EDUCATION_ID, entry.wantsEducation],
      [process.env.RESEND_TOPIC_LAUNCH_ID, entry.wantsLaunchNews],
    ] as const;
    const topics = topicDefinitions.flatMap(([id, enabled]) =>
      id?.trim()
        ? [{ id: id.trim(), subscription: enabled ? ("opt_in" as const) : ("opt_out" as const) }]
        : []
    );

    const [{ error }, topicResult] = await Promise.all([
      resend.contacts.update({
        email: entry.email,
        unsubscribed: entry.status === "UNSUBSCRIBED" || entry.status === "SUPPRESSED",
        properties: {
          experience_level: entry.experienceLevel ?? "unknown",
          learning_goal: entry.learningGoal ?? "unknown",
          market_interest: entry.marketInterest ?? "unknown",
          wants_product_updates: String(entry.wantsProductUpdates),
          wants_education: String(entry.wantsEducation),
          wants_launch_news: String(entry.wantsLaunchNews),
          lifecycle_stage: entry.lifecycleStage.toLowerCase(),
          converted: String(entry.status === "CONVERTED"),
          engaged: String(Boolean(entry.engagedAt)),
        },
      }),
      topics.length
        ? resend.contacts.topics.update({ email: entry.email, topics })
        : Promise.resolve({ error: null }),
    ]);

    if (error) throw new Error(error.message);
    if (topicResult.error) throw new Error(topicResult.error.message);

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        resendSyncStatus: WaitlistSyncStatus.SYNCED,
        resendSyncError: null,
        lastSyncedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        resendSyncStatus: WaitlistSyncStatus.FAILED,
        resendSyncError: errorMessage(error),
      },
    });
    console.error("[waitlist] preference sync failed", {
      entryId: entry.id,
      error: errorMessage(error),
    });
    return false;
  }
}

export async function canSendWaitlistMarketing(entryId: string): Promise<boolean> {
  const entry = await db.waitlistEntry.findUnique({
    where: { id: entryId },
    select: { status: true },
  });
  if (!entry || entry.status !== "ACTIVE") return false;

  const now = Date.now();
  const [lastDay, lastSevenDays] = await Promise.all([
    db.waitlistEmailEvent.count({
      where: {
        waitlistEntryId: entryId,
        eventType: WaitlistEmailEventType.SENT,
        isMarketing: true,
        occurredAt: { gte: new Date(now - 24 * 60 * 60 * 1000) },
      },
    }),
    db.waitlistEmailEvent.count({
      where: {
        waitlistEntryId: entryId,
        eventType: WaitlistEmailEventType.SENT,
        isMarketing: true,
        occurredAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return isWithinWaitlistFrequencyCap(lastDay, lastSevenDays);
}

export async function retryFailedWaitlistSync(limit = 50): Promise<{
  synced: number;
  attempted: number;
  skippedIneligible: number;
  failedEligible: number;
  lastError: string | null;
}> {
  const take = Math.min(Math.max(limit, 1), 100);
  const entries = await db.waitlistEntry.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { resendSyncStatus: { in: [WaitlistSyncStatus.PENDING, WaitlistSyncStatus.FAILED] } },
        { automationEnrolledAt: null },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take,
    select: { id: true, email: true },
  });

  let synced = 0;
  let skippedIneligible = 0;
  let failedEligible = 0;
  let lastError: string | null = null;

  for (const entry of entries) {
    if (!isWaitlistLifecycleEligible(entry.id, entry.email)) {
      skippedIneligible += 1;
      continue;
    }

    await db.waitlistEntry.updateMany({
      where: {
        id: entry.id,
        resendSyncStatus: WaitlistSyncStatus.FAILED,
        automationEnrolledAt: { not: null },
      },
      data: {
        automationEnrolledAt: null,
        resendSyncStatus: WaitlistSyncStatus.PENDING,
        resendSyncError: null,
      },
    });

    if (await syncWaitlistLifecycle(entry.id)) {
      synced += 1;
      continue;
    }

    failedEligible += 1;
    const failed = await db.waitlistEntry.findUnique({
      where: { id: entry.id },
      select: { resendSyncError: true },
    });
    lastError = failed?.resendSyncError ?? lastError;
  }

  return { synced, attempted: entries.length, skippedIneligible, failedEligible, lastError };
}

export async function markWaitlistConverted(email: string): Promise<boolean> {
  try {
    const entry = await db.waitlistEntry.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, convertedAt: true },
    });
    if (!entry) return false;

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: "CONVERTED",
        lifecycleStage: "CONVERTED",
        convertedAt: entry.convertedAt ?? new Date(),
        resendSyncStatus: "PENDING",
      },
    });

    return syncWaitlistPreferences(entry.id);
  } catch (error) {
    console.error("[waitlist] conversion sync failed", { error: errorMessage(error) });
    return false;
  }
}

