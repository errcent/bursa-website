import type { NextRequest } from "next/server";

import { verifyAccessToken } from "@/lib/auth/mobile-jwt";

/** Extract Bearer access token from Authorization header (mobile clients). */
export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

/** Resolve email from mobile JWT if present and valid. */
export async function resolveMobileJwtEmail(request: Request): Promise<string | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.email ?? null;
}

/** Stable device id from mobile client header. */
export function resolveDeviceId(request: Request): string | null {
  return request.headers.get("x-device-id")?.trim() ?? null;
}

export function resolveClientPlatformHeader(request: Request): string | null {
  return request.headers.get("x-platform")?.trim() ?? null;
}

export function clientIpFromRequest(request: NextRequest | Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
