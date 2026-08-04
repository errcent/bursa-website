import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { after, NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { waitlistSubmitSchema } from "@/lib/waitlist/validation";
import { isTurnstileBlockingMisconfiguration, isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile/verify";
import { isWaitlistEmailEnabled, sendWaitlistConfirmationEmail } from "@/lib/waitlist/email";
import {
  WAITLIST_CONSENT_PURPOSE,
  WAITLIST_CONSENT_VERSION,
} from "@/lib/waitlist/config";
import { syncWaitlistLifecycle } from "@/lib/waitlist/resend";
import { duplicateWaitlistTransition } from "@/lib/waitlist/state";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const body = waitlistSubmitSchema.parse(await request.json());

    if (body.website) {
      return jsonOk({ ok: true, duplicate: false });
    }

    if (isTurnstileBlockingMisconfiguration()) {
      return jsonError("Waitlist sementara tidak tersedia. Coba lagi nanti.", 503);
    }

    if (isTurnstileConfigured()) {
      const valid = await verifyTurnstileToken(body.turnstileToken, ip);
      if (!valid) {
        return jsonError("Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.", 400);
      }
    }

    const email = body.email.toLowerCase();
    const ipHash = hashIp(ip);
    const now = new Date();
    const referrer = body.referralCode
      ? await db.waitlistEntry.findUnique({
          where: { referralCode: body.referralCode },
          select: { referralCode: true, email: true },
        })
      : null;

    let duplicate = false;
    let shouldSendConfirmation = true;
    let shouldSyncLifecycle = true;
    let entryId: string;

    try {
      const created = await db.waitlistEntry.create({
        data: {
          email,
          consentGiven: true,
          consentedAt: now,
          consentVersion: WAITLIST_CONSENT_VERSION,
          consentPurpose: WAITLIST_CONSENT_PURPOSE,
          source: body.source ?? "waitlist-page",
          utmSource: body.utmSource ?? null,
          utmMedium: body.utmMedium ?? null,
          utmCampaign: body.utmCampaign ?? null,
          utmContent: body.utmContent ?? null,
          referredByCode: referrer?.email !== email ? (referrer?.referralCode ?? null) : null,
          ipHash,
          // Waitlist is single opt-in: explicit consent confirms the entry immediately.
          // Email verification remains reserved for email/password account registration.
          emailVerifiedAt: now,
          verificationTokenHash: null,
          verificationExpiresAt: null,
        },
        select: { id: true },
      });
      entryId = created.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        duplicate = true;
        const existing = await db.waitlistEntry.findUnique({
          where: { email },
          select: { id: true, emailVerifiedAt: true, status: true },
        });
        if (!existing) throw error;
        entryId = existing.id;
        const alreadyConfirmed = Boolean(existing?.emailVerifiedAt);
        const transition = duplicateWaitlistTransition(existing.status, alreadyConfirmed);
        shouldSendConfirmation = transition.shouldSendConfirmation;
        shouldSyncLifecycle = transition.shouldSyncLifecycle;

        // Recover entries created by the previous double-opt-in flow. A retry confirms
        // them immediately. A fresh explicit consent may also reactivate an unsubscribe,
        // but never overrides bounce/complaint suppression.
        if (transition.shouldConfirm) {
          await db.waitlistEntry.update({
            where: { email },
            data: {
              consentGiven: true,
              consentedAt: now,
              consentVersion: WAITLIST_CONSENT_VERSION,
              consentPurpose: WAITLIST_CONSENT_PURPOSE,
              status: transition.nextStatus,
              unsubscribedAt: null,
              lifecycleStage: "CONFIRMED",
              automationEnrolledAt: null,
              resendSyncStatus: "PENDING",
              resendSyncError: null,
              emailVerifiedAt: now,
              verificationTokenHash: null,
              verificationExpiresAt: null,
            },
          });
        }
      } else {
        throw error;
      }
    }

    const confirmationEmailScheduled = isWaitlistEmailEnabled() && shouldSendConfirmation;
    if (confirmationEmailScheduled) {
      after(async () => {
        try {
          const sent = await sendWaitlistConfirmationEmail(entryId);
          if (!sent) {
            console.warn("[waitlist] confirmation email was not sent:", { entryId });
          }
        } catch (error) {
          console.error("[waitlist] confirmation email pipeline failed:", error);
        }
      });
    }
    if (shouldSyncLifecycle) {
      after(async () => {
        await syncWaitlistLifecycle(entryId);
      });
    }

    return jsonOk(
      { ok: true, duplicate, confirmationEmailScheduled },
      duplicate ? 200 : 201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
