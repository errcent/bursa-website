import { after, NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { sendAccountVerificationEmail } from "@/lib/auth/auth-email";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { isEmailConfigured } from "@/lib/email/config";
import { checkRateLimit, clientIp, rateLimitResponse } from "@/lib/auth/rate-limit";
import { resolveTrustedEmail } from "@/lib/auth/request-identity";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`resend-verify:${ip}`, 3, 60 * 60 * 1000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSec);
    }

    const email = await resolveTrustedEmail(request);
    if (!email) {
      return jsonError("Masuk terlebih dahulu untuk meminta tautan verifikasi baru.", 401);
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true, nama: true },
    });
    if (!user) {
      return jsonError("Akun tidak ditemukan.", 404);
    }

    if (user.emailVerifiedAt) {
      return jsonOk({ alreadyVerified: true, message: "Email sudah terverifikasi." });
    }

    if (!isEmailConfigured()) {
      return jsonError("Layanan email belum dikonfigurasi. Coba lagi nanti.", 503);
    }

    const verifyToken = await createEmailVerificationToken(user.id);

    after(async () => {
      try {
        await sendAccountVerificationEmail({
          email: user.email,
          name: user.nama,
          token: verifyToken,
        });
      } catch (error) {
        console.error("[resend-verification] email error:", error);
      }
    });

    return jsonOk({
      sent: true,
      message: "Tautan verifikasi baru telah dikirim ke email kamu.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
