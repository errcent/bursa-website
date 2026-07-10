/** Prototype device-session store (localStorage). Production: persist DeviceSession in DB and enforce server-side. */

export const MAX_DEVICES_PER_ACCOUNT = 2;

export interface DeviceSession {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  lastActiveAt: string;
  createdAt: string;
}

const DEVICE_SESSIONS_PREFIX = "bursa-device-sessions:";
const CURRENT_DEVICE_KEY = "bursa-current-device-id";

function isBrowser() {
  return typeof window !== "undefined";
}

function sessionsKey(userId: string) {
  return `${DEVICE_SESSIONS_PREFIX}${userId}`;
}

/** Simple fingerprint from userAgent + screen — replace with robust client id in production. */
export function getDeviceFingerprint(): string {
  if (!isBrowser()) return "dev-ssr";
  const raw = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
    navigator.language,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `dev-${Math.abs(hash).toString(36)}`;
}

export function getCurrentDeviceId(): string {
  if (!isBrowser()) return getDeviceFingerprint();
  try {
    const stored = localStorage.getItem(CURRENT_DEVICE_KEY);
    if (stored) return stored;
  } catch {
    // ignore
  }
  const id = getDeviceFingerprint();
  try {
    localStorage.setItem(CURRENT_DEVICE_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function parseDeviceName(userAgent: string): string {
  const ua = userAgent || "";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/Opera|OPR\//i.test(ua)) browser = "Opera";

  let os = "Perangkat";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua) && !/iPhone|iPad/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return `${browser} · ${os}`;
}

function readSessions(userId: string): DeviceSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(sessionsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeviceSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(userId: string, sessions: DeviceSession[]) {
  if (!isBrowser()) return;
  localStorage.setItem(sessionsKey(userId), JSON.stringify(sessions));
}

export function getDeviceSessions(userId: string): DeviceSession[] {
  return readSessions(userId).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

export function touchDeviceSession(userId: string, deviceId = getCurrentDeviceId()): void {
  const sessions = readSessions(userId);
  const now = new Date().toISOString();
  const idx = sessions.findIndex((s) => s.deviceId === deviceId);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], lastActiveAt: now };
    writeSessions(userId, sessions);
    return;
  }
  if (sessions.length >= MAX_DEVICES_PER_ACCOUNT) return;
  const ua = isBrowser() ? navigator.userAgent : "";
  sessions.push({
    deviceId,
    deviceName: parseDeviceName(ua),
    userAgent: ua,
    lastActiveAt: now,
    createdAt: now,
  });
  writeSessions(userId, sessions);
}

export type RegisterDeviceResult =
  | { ok: true; deviceId: string }
  | { ok: false; error: string };

/**
 * Enforce max 2 devices on login (client-side prototype).
 * Production: validate on server when issuing session/token.
 */
export function registerDeviceOnLogin(userId: string): RegisterDeviceResult {
  const deviceId = getCurrentDeviceId();
  const sessions = readSessions(userId);
  const existing = sessions.find((s) => s.deviceId === deviceId);
  const now = new Date().toISOString();
  const ua = isBrowser() ? navigator.userAgent : "";

  if (existing) {
    const next = sessions.map((s) =>
      s.deviceId === deviceId ? { ...s, lastActiveAt: now, deviceName: parseDeviceName(ua) } : s
    );
    writeSessions(userId, next);
    return { ok: true, deviceId };
  }

  if (sessions.length >= MAX_DEVICES_PER_ACCOUNT) {
    return {
      ok: false,
      error:
        "Akun ini sudah aktif di 2 perangkat. Keluar dari salah satu perangkat lain di Pengaturan → Perangkat, lalu coba masuk lagi.",
    };
  }

  writeSessions(userId, [
    ...sessions,
    {
      deviceId,
      deviceName: parseDeviceName(ua),
      userAgent: ua,
      lastActiveAt: now,
      createdAt: now,
    },
  ]);
  return { ok: true, deviceId };
}

export function revokeDeviceSession(userId: string, deviceId: string): void {
  const sessions = readSessions(userId).filter((s) => s.deviceId !== deviceId);
  writeSessions(userId, sessions);
}

export function formatLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
