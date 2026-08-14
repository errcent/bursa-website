import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { notifyAdminOfMentorApplication } from "@/lib/mentor-program/application-notification";
import { createMentorApplication } from "@/lib/mentor-program/applications";
import { isMentorApplicationDocumentUrl } from "@/lib/mentor-program/document-storage";
import {
  isTurnstileBlockingMisconfiguration,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from "@/lib/turnstile/verify";
import { mentorApplicationSchema } from "@/lib/validations/api";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = await checkRateLimit(`mentor-app:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const body = await request.json();
    const parsed = mentorApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.issues.map((i) => i.message).join(", "), 422);
    }

    if (
      !isMentorApplicationDocumentUrl(parsed.data.cvDocumentUrl) ||
      (parsed.data.certificateDocumentUrl &&
        !isMentorApplicationDocumentUrl(parsed.data.certificateDocumentUrl))
    ) {
      return jsonError("Dokumen harus diunggah lewat formulir (URL tidak valid).", 422);
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

    const {
      portfolioUrl,
      certificateDocumentUrl,
      certificateDocumentName,
      turnstileToken: _turnstile,
      ...rest
    } = parsed.data;
    const application = await createMentorApplication({
      ...rest,
      portfolioUrl: portfolioUrl || undefined,
      certificateDocumentUrl: certificateDocumentUrl || undefined,
      certificateDocumentName: certificateDocumentName || undefined,
    });

    after(async () => {
      try {
        await notifyAdminOfMentorApplication(application);
      } catch (error) {
        console.error("[mentor-application] Unhandled email error:", error);
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
