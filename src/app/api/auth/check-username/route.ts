import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { checkRateLimit, clientIp, normalizeRateLimitId } from "@/lib/auth/rate-limit";
import { resolveAuthenticatedUser } from "@/lib/auth/request-identity";
import { usernameSchema } from "@/lib/auth/validation";
import { db } from "@/lib/db";

const ENUMERATION_DELAY_MS = 200;

/**
 * GET /api/auth/check-username?username=xxx
 * Returns { available: boolean } for registration / profile edit.
 * U-009: excludeUserId only honored for the authenticated owner.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const raw = request.nextUrl.searchParams.get("username")?.trim() ?? "";
    const usernameKey = normalizeRateLimitId(raw) || "invalid";
    const rate = await checkRateLimit(`check-username:${usernameKey}:${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(`Terlalu banyak permintaan. Coba lagi dalam ${rate.retryAfterSec} detik.`, 429);
    }

    const parsed = usernameSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError("Username tidak valid.", 400);
    }
    const username = parsed.data;

    const excludeUserId = request.nextUrl.searchParams.get("excludeUserId")?.trim();
    let effectiveExcludeId: string | null = null;
    if (excludeUserId) {
      const authUser = await resolveAuthenticatedUser(request, { createIfMissing: false });
      if (authUser && authUser.id === excludeUserId) {
        effectiveExcludeId = excludeUserId;
      }
    }

    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    const available = !existing || (effectiveExcludeId != null && existing.id === effectiveExcludeId);

    await new Promise((r) => setTimeout(r, ENUMERATION_DELAY_MS));

    return jsonOk({ available });
  } catch (error) {
    return handleApiError(error);
  }
}
