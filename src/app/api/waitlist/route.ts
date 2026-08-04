import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { waitlistSubmitSchema } from "@/lib/waitlist/validation";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile/verify";
import { isWaitlistEmailEnabled, sendWaitlistVerificationEmail } from "@/lib/waitlist/email";
import { issueWaitlistVerificationToken } from "@/lib/waitlist/verification";

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

    // Double opt-in runs only when Resend is configured. Without it a sign-up would be
    // stranded as unverified with no way to confirm, so consent alone confirms the entry.
    const verificationRequired = isWaitlistEmailEnabled();

    let duplicate = false;
    let needsVerificationEmail = verificationRequired;

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
          emailVerifiedAt: verificationRequired ? null : now,
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
        const alreadyVerified = Boolean(existing?.emailVerifiedAt);
        needsVerificationEmail = verificationRequired && !alreadyVerified;

        if (!verificationRequired && !alreadyVerified) {
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

    let verificationEmailSent = false;
    if (needsVerificationEmail) {
      try {
        const token = await issueWaitlistVerificationToken(email);
        verificationEmailSent = await sendWaitlistVerificationEmail(email, token);
      } catch (error) {
        console.error("[waitlist] verification email pipeline failed:", error);
      }
    }

    return jsonOk(
      { ok: true, duplicate, verificationRequired, verificationEmailSent },
      duplicate ? 200 : 201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
