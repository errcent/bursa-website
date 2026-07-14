import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { maskEmail } from "@/lib/auth/password-policy";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";

const forgotSchema = z.object({
  email: z.string().email("Format email tidak valid."),
});

const GENERIC_MESSAGE =
  "Jika email terdaftar di Bursa, kami akan mengirim tautan reset kata sandi. Periksa kotak masuk dan folder spam.";

/**
 * Request password reset — always returns the same message (no email enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`forgot-password:${ip}`, 3, 60 * 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak permintaan. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = forgotSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      await createPasswordResetToken(user.id);
    }

    return jsonOk({
      ok: true,
      message: GENERIC_MESSAGE,
      maskedEmail: maskEmail(email),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
