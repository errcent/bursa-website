import { createHash } from "crypto";

import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { upsertGoogleOAuthUser } from "@/lib/auth/google-oauth";
import { sendWelcomeEmail } from "@/lib/auth/auth-email";
import { mobileGoogleSchema, resolveDeviceId } from "@/lib/auth/mobile-auth";
import { issueMobileTokenPair, parseClientPlatform, verifyGoogleIdToken } from "@/lib/auth/mobile-jwt";
import { clientIpFromRequest } from "@/lib/auth/mobile-request";
import { checkRateLimit, clientIp } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rate = checkRateLimit(`mobile-google:${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return jsonError(
        `Terlalu banyak percobaan. Coba lagi dalam ${rate.retryAfterSec} detik.`,
        429
      );
    }

    const body = mobileGoogleSchema.parse(await request.json());
    const googleUser = await verifyGoogleIdToken(body.idToken);
    if (!googleUser) {
      return jsonError("Token Google tidak valid.", 401);
    }

    const { user, isNew } = await upsertGoogleOAuthUser({
      email: googleUser.email,
      name: googleUser.name,
    });

    if (isNew) {
      void sendWelcomeEmail({ email: user.email, name: user.nama });
    }

    const ipHash = createHash("sha256")
      .update(clientIpFromRequest(request))
      .digest("hex")
      .slice(0, 32);

    const tokens = await issueMobileTokenPair({
      user,
      deviceId: resolveDeviceId(body.deviceId, request),
      platform: parseClientPlatform(body.platform ?? request.headers.get("x-platform")),
      userAgent: request.headers.get("user-agent"),
      ipHash,
    });

    return jsonOk(tokens);
  } catch (error) {
    return handleApiError(error);
  }
}
