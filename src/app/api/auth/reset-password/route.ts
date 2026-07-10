import { NextRequest } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { validatePassword } from "@/lib/auth/password-policy";
import { resetPasswordWithToken, validateResetToken } from "@/lib/auth/password-reset";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

const resetSchema = z.object({
  token: z.string().min(32, "Token tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return jsonError("Token reset diperlukan.", 400);
    }

    const result = await validateResetToken(token);
    if (!result.valid) {
      const message =
        result.reason === "expired"
          ? "Tautan reset sudah kedaluwarsa. Minta tautan baru."
          : "Tautan reset tidak valid atau sudah digunakan.";
      return jsonError(message, 400);
    }

    return jsonOk({ valid: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`reset-password:${ip}`, 5, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak percobaan. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = resetSchema.parse(await request.json());
    const policy = validatePassword(body.password);
    if (!policy.valid) {
      return jsonError(policy.errors[0] ?? "Kata sandi tidak memenuhi persyaratan.", 422);
    }

    const result = await resetPasswordWithToken(body.token, body.password);
    if (!result.valid) {
      const message =
        result.reason === "expired"
          ? "Tautan reset sudah kedaluwarsa. Minta tautan baru."
          : "Tautan reset tidak valid atau sudah digunakan.";
      return jsonError(message, 400);
    }

    return jsonOk({
      ok: true,
      message: "Kata sandi berhasil diperbarui.",
      email: result.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
