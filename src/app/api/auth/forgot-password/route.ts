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

const isPrototype =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

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

    let prototypeResetUrl: string | undefined;
    if (user) {
      const token = await createPasswordResetToken(user.id);
      if (isPrototype) {
        const origin =
          request.headers.get("origin") ||
          request.headers.get("x-forwarded-host")?.replace(/^/, "https://") ||
          "http://localhost:3000";
        const base = origin.startsWith("http") ? origin : `https://${origin}`;
        prototypeResetUrl = `${base}/lupa-password/reset?token=${token}`;
      }
    }

    return jsonOk({
      ok: true,
      message: GENERIC_MESSAGE,
      maskedEmail: maskEmail(email),
      ...(prototypeResetUrl ? { prototypeResetUrl } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
