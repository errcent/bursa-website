import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";
import { usernameSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

/**
 * GET /api/auth/check-username?username=xxx
 * Returns { available: boolean } for registration / profile edit.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`check-username:${ip}`, 30, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(`Terlalu banyak permintaan. Coba lagi dalam ${rate.retryAfterSec} detik.`, 429);
    }

    const raw = request.nextUrl.searchParams.get("username")?.trim() ?? "";
    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Username tidak valid.", 400);
    }
    const username = parsed.data;

    const excludeUserId = request.nextUrl.searchParams.get("excludeUserId")?.trim();

    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    const available = !existing || (excludeUserId != null && existing.id === excludeUserId);

    return jsonOk({ available, username });
  } catch (error) {
    return handleApiError(error);
  }
}
