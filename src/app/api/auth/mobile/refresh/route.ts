import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mobileRefreshSchema } from "@/lib/auth/mobile-auth";
import { rotateRefreshToken } from "@/lib/auth/mobile-jwt";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`mobile-refresh:${ip}`, 30, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak permintaan. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = mobileRefreshSchema.parse(await request.json());
    const deviceId =
      body.deviceId?.trim() || request.headers.get("x-device-id")?.trim() || undefined;

    const tokens = await rotateRefreshToken({
      refreshToken: body.refreshToken,
      deviceId,
    });

    if (!tokens) {
      return jsonError("Sesi tidak valid. Silakan masuk kembali.", 401);
    }

    return jsonOk(tokens);
  } catch (error) {
    return handleApiError(error);
  }
}
