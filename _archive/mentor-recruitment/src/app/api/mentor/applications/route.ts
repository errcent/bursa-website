import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { createOpenL1Application } from "@/lib/mentor-program/applications";
import { drainMentorApplicationOutbox } from "@/lib/mentor-program/outbox";
import {
  isTurnstileBlockingMisconfiguration,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from "@/lib/turnstile/verify";
import { mentorL1ApplicationSchema } from "@/lib/validations/mentor-application";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = await checkRateLimit(`mentor-app:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const body = await request.json();
    const parsed = mentorL1ApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((issue) => issue.message).join(", "), 422);
    }

    if (isTurnstileBlockingMisconfiguration()) {
      return jsonError("Formulir sementara tidak tersedia. Coba lagi nanti.", 503);
    }

    if (isTurnstileConfigured()) {
      const token = parsed.data.turnstileToken?.trim();
      if (!token) {
        return jsonError("Verifikasi keamanan wajib. Muat ulang halaman dan coba lagi.", 400);
      }
      const valid = await verifyTurnstileToken(token, ip);
      if (!valid) {
        return jsonError("Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.", 400);
      }
    }

    const application = await createOpenL1Application(parsed.data);

    after(async () => {
      try {
        await drainMentorApplicationOutbox();
      } catch (error) {
        console.error("[mentor-application] outbox drain failed:", error);
      }
    });

    return jsonOk({ id: application.id, status: application.status }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
