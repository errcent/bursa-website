import { createHash, randomBytes } from "crypto";

import { ClientPlatform, type User } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth/google-oauth";

const ACCESS_TOKEN_TTL_SEC = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function jwtSecret(): Uint8Array {
  const secret =
    process.env.MOBILE_JWT_SECRET?.trim() ||
    getAuthSecret();
  return new TextEncoder().encode(secret);
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashDeviceId(deviceId: string): string {
  return hashToken(`device:${deviceId.trim()}`);
}

export function parseClientPlatform(value: string | null | undefined): ClientPlatform {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "android") return ClientPlatform.ANDROID;
  if (normalized === "ios") return ClientPlatform.IOS;
  return ClientPlatform.WEB;
}

export interface MobileAuthUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  phone: string | null;
  role: string;
}

export function serializeMobileUser(user: User): MobileAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.nama,
    username: user.username,
    phone: user.phone,
    role: user.role,
  };
}

export async function signAccessToken(user: Pick<User, "id" | "email">): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const expiresIn = ACCESS_TOKEN_TTL_SEC;
  const accessToken = await new SignJWT({
    sub: user.id,
    email: user.email,
    typ: "mobile_access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(jwtSecret());

  return { accessToken, expiresIn };
}

export async function verifyAccessToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (payload.typ !== "mobile_access") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!userId || !email) return null;
    return { userId, email: email.trim().toLowerCase() };
  } catch {
    return null;
  }
}

function generateRefreshTokenValue(): string {
  return randomBytes(48).toString("base64url");
}

export async function issueMobileTokenPair(params: {
  user: User;
  deviceId: string;
  platform?: ClientPlatform;
  userAgent?: string | null;
  ipHash?: string | null;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: MobileAuthUser;
}> {
  const deviceHash = hashDeviceId(params.deviceId);
  const platform = params.platform ?? ClientPlatform.IOS;
  const now = new Date();

  const userSession = await db.userSession.upsert({
    where: { userId_deviceHash: { userId: params.user.id, deviceHash } },
    create: {
      userId: params.user.id,
      deviceHash,
      platform,
      userAgent: params.userAgent?.slice(0, 255) ?? null,
      ipHash: params.ipHash ?? null,
      lastSeenAt: now,
    },
    update: {
      platform,
      userAgent: params.userAgent?.slice(0, 255) ?? null,
      ipHash: params.ipHash ?? null,
      lastSeenAt: now,
      revokedAt: null,
    },
  });

  const refreshToken = generateRefreshTokenValue();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);

  await db.refreshToken.create({
    data: {
      userId: params.user.id,
      userSessionId: userSession.id,
      tokenHash: hashToken(refreshToken),
      deviceHash,
      platform,
      expiresAt,
    },
  });

  const { accessToken, expiresIn } = await signAccessToken(params.user);

  return {
    accessToken,
    refreshToken,
    expiresIn,
    user: serializeMobileUser(params.user),
  };
}

export async function rotateRefreshToken(params: {
  refreshToken: string;
  deviceId?: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  const tokenHash = hashToken(params.refreshToken.trim());
  const row = await db.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    return null;
  }

  if (params.deviceId) {
    const deviceHash = hashDeviceId(params.deviceId);
    if (deviceHash !== row.deviceHash) {
      return null;
    }
  }

  await db.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  return issueMobileTokenPair({
    user: row.user,
    deviceId: params.deviceId ?? row.deviceHash,
    platform: row.platform,
  }).then(({ accessToken, refreshToken, expiresIn }) => ({
    accessToken,
    refreshToken,
    expiresIn,
  }));
}

export async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(refreshToken.trim());
  const row = await db.refreshToken.findUnique({ where: { tokenHash }, select: { id: true } });
  if (!row) return false;
  await db.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });
  return true;
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  email: string;
  name?: string;
  sub: string;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;

  const url = new URL("https://oauth2.googleapis.com/tokeninfo");
  url.searchParams.set("id_token", idToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    name?: string;
    sub?: string;
  };

  if (data.aud !== clientId) return null;
  const verified = data.email_verified;
  if (verified !== "true" && verified !== true) return null;
  if (!data.email || !data.sub) return null;

  return {
    email: data.email.trim().toLowerCase(),
    name: data.name,
    sub: data.sub,
  };
}
