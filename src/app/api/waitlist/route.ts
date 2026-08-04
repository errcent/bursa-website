import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { after, NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { waitlistSubmitSchema } from "@/lib/waitlist/validation";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile/verify";
import { isWaitlistEmailEnabled, sendWaitlistConfirmationEmail } from "@/lib/waitlist/email";

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

    if (isTurnstileConfigured()) {
      const valid = await verifyTurnstileToken(body.turnstileToken, ip);
      if (!valid) {
        return jsonError("Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.", 400);
      }
    }

    const email = body.email.toLowerCase();
    const ipHash = hashIp(ip);
    const now = new Date();

    let duplicate = false;
    let shouldSendConfirmation = true;

    try {
      await db.waitlistEntry.create({
        data: {
          email,
          consentGiven: true,
          source: body.source ?? "waitlist-page",
          utmSource: body.utmSource ?? null,
          utmMedium: body.utmMedium ?? null,
          utmCampaign: body.utmCampaign ?? null,
          utmContent: body.utmContent ?? null,
          ipHash,
          // Waitlist is single opt-in: explicit consent confirms the entry immediately.
          // Email verification remains reserved for email/password account registration.
          emailVerifiedAt: now,
          verificationTokenHash: null,
          verificationExpiresAt: null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        duplicate = true;
        const existing = await db.waitlistEntry.findUnique({
          where: { email },
          select: { emailVerifiedAt: true },
        });
        const alreadyConfirmed = Boolean(existing?.emailVerifiedAt);
        shouldSendConfirmation = !alreadyConfirmed;

        // Recover entries created by the previous double-opt-in flow. A retry confirms
        // them immediately and sends the normal waitlist confirmation once.
        if (!alreadyConfirmed) {
          await db.waitlistEntry.update({
            where: { email },
            data: {
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
          const sent = await sendWaitlistConfirmationEmail(email);
          if (!sent) {
            console.warn("[waitlist] confirmation email was not sent:", { email });
          }
        } catch (error) {
          console.error("[waitlist] confirmation email pipeline failed:", error);
        }
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
