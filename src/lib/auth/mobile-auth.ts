import { createHash } from "crypto";

import type { NextRequest } from "next/server";
import { z } from "zod";

import { findUserByIdentifier, verifyPassword } from "@/lib/auth/server";
import {
  hashDeviceId,
  issueMobileTokenPair,
  parseClientPlatform,
} from "@/lib/auth/mobile-jwt";
import { clientIpFromRequest } from "@/lib/auth/mobile-request";

const GENERIC_LOGIN_ERROR = "Username, email, telepon, atau kata sandi salah.";

export const mobileLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  deviceId: z.string().min(8).max(128).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

export const mobileRefreshSchema = z.object({
  refreshToken: z.string().min(20),
  deviceId: z.string().min(8).max(128).optional(),
});

export const mobileGoogleSchema = z.object({
  idToken: z.string().min(20),
  deviceId: z.string().min(8).max(128).optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

function ipHash(request: NextRequest): string {
  return createHash("sha256").update(clientIpFromRequest(request)).digest("hex").slice(0, 32);
}

function resolveDeviceId(bodyDeviceId: string | undefined, request: NextRequest): string {
  return bodyDeviceId?.trim() || request.headers.get("x-device-id")?.trim() || "unknown-device";
}

export async function authenticateWithPassword(
  request: NextRequest,
  body: z.infer<typeof mobileLoginSchema>
) {
  const user = await findUserByIdentifier(body.identifier);
  if (!user) {
    return { error: GENERIC_LOGIN_ERROR, status: 401 as const };
  }

  const valid = await verifyPassword(user, body.password);
  if (!valid) {
    return { error: GENERIC_LOGIN_ERROR, status: 401 as const };
  }

  const tokens = await issueMobileTokenPair({
    user,
    deviceId: resolveDeviceId(body.deviceId, request),
    platform: parseClientPlatform(body.platform ?? request.headers.get("x-platform")),
    userAgent: request.headers.get("user-agent"),
    ipHash: ipHash(request),
  });

  return { tokens };
}

export { hashDeviceId, resolveDeviceId };
