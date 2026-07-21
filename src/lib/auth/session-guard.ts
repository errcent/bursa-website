import { createHash } from "crypto";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";

/**
 * Anti-account-sharing controls (QC-20260719-38).
 *
 * LOCKED constraints untouched: this does NOT change pricing or the lifetime
 * one-time-access model. It caps how many distinct devices can stream a single
 * account concurrently, records lightweight device/IP fingerprints for anomaly
 * detection, and exposes a per-user watermark for the player overlay.
 */
export const CONCURRENT_DEVICE_CAP = 3;
export const SESSION_ACTIVE_WINDOW_MINUTES = 20;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function deviceFingerprint(request: NextRequest): {
  deviceHash: string;
  ipHash: string;
  userAgent: string;
} {
  const mobileDeviceId = request.headers.get("x-device-id")?.trim();
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const ip = clientIp(request);
  if (mobileDeviceId) {
    const deviceHash = hash(`mobile:${mobileDeviceId}`);
    return {
      deviceHash,
      ipHash: hash(ip),
      userAgent: userAgent.slice(0, 255),
    };
  }
  return {
    deviceHash: hash(`${userAgent}|${ip}`),
    ipHash: hash(ip),
    userAgent: userAgent.slice(0, 255),
  };
}

export interface SessionTouchResult {
  allowed: boolean;
  activeDevices: number;
  anomaly: boolean;
}

/**
 * Records/refreshes the caller's device session and enforces the concurrent-device
 * cap. Returns `allowed:false` when the account is being streamed from too many
 * distinct devices at once (likely credential sharing).
 */
export async function touchSession(
  request: NextRequest,
  userId: string
): Promise<SessionTouchResult> {
  const { deviceHash, ipHash, userAgent } = deviceFingerprint(request);
  const now = new Date();

  await db.userSession.upsert({
    where: { userId_deviceHash: { userId, deviceHash } },
    create: { userId, deviceHash, ipHash, userAgent, lastSeenAt: now },
    update: { lastSeenAt: now, ipHash, userAgent, revokedAt: null },
  });

  const activeSince = new Date(now.getTime() - SESSION_ACTIVE_WINDOW_MINUTES * 60_000);
  const activeSessions = await db.userSession.findMany({
    where: { userId, revokedAt: null, lastSeenAt: { gte: activeSince } },
    orderBy: { lastSeenAt: "desc" },
    select: { deviceHash: true },
  });

  const distinctDevices = new Set(activeSessions.map((s) => s.deviceHash));
  const activeDevices = distinctDevices.size;
  const allowed = activeDevices <= CONCURRENT_DEVICE_CAP;

  return { allowed, activeDevices, anomaly: !allowed };
}

/** Per-user overlay text so leaked screen-recordings are traceable to the buyer. */
export function sessionWatermark(user: { id: string; email?: string | null }): string {
  const tag = user.email ? user.email.split("@")[0] : user.id.slice(0, 8);
  return `${tag} · ${user.id.slice(0, 6)}`;
}
