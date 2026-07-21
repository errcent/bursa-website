import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { authenticateWithPassword, mobileLoginSchema } from "@/lib/auth/mobile-auth";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`mobile-login:${ip}`, 5, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak percobaan masuk. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = mobileLoginSchema.parse(await request.json());
    const result = await authenticateWithPassword(request, body);

  if ("error" in result && result.error) {
      return jsonError(result.error, result.status);
    }

    return jsonOk(result.tokens);
  } catch (error) {
    return handleApiError(error);
  }
}
