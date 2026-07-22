import { registerDeviceOnLogin, touchDeviceSession } from "./devices";
import {
  hashPasswordForStorage,
  normalizeStoredPassword,
  verifyStoredPassword,
} from "./password-storage";
import type { AuthSession, LoginInput, RegisterInput, StoredUser, UserRole } from "./types";
import {
  classifyLoginIdentifier,
  normalizeIndonesianPhone,
  normalizeLoginIdentifier,
} from "./validation";

const USERS_KEY = "bursa-users";
const SESSION_KEY = "bursa-session";
const AUTH_CHANGE_EVENT = "bursa-auth-change";
/** Set briefly during logout so AuthGuard does not re-attach a sticky ?next=. */
export const LOGOUT_FLAG_KEY = "bursa-logging-out";

let cachedUsersRaw: string | null | undefined;
let cachedUsers: StoredUser[] | null = null;

let cachedSessionRaw: string | null | undefined;
let cachedSession: AuthSession | null = null;

const DEMO_USER: StoredUser = {
  id: "user-demo-andi",
  name: "Andi Rahayu",
  email: "demo@bursa.id",
  username: "andi_r",
  phone: "+6281110000002",
  password: hashPasswordForStorage("demo1234"),
  role: "learner",
  createdAt: "2026-01-15T00:00:00.000Z",
};

const ADMIN_USER: StoredUser = {
  id: "user-admin-seed",
  name: "Test Admin",
  email: "admin@test.dev",
  username: "test_admin",
  phone: "+6281110000003",
  password: hashPasswordForStorage("password123"),
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const LEARNER_USER: StoredUser = {
  id: "user-learner-seed",
  name: "Test Learner",
  email: "learner@test.dev",
  username: "test_learner",
  phone: "+6281110000001",
  password: hashPasswordForStorage("password123"),
  role: "learner",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const MENTOR_USER: StoredUser = {
  id: "user-mentor-seed",
  name: "Test Mentor",
  email: "mentor@test.dev",
  username: "test_mentor",
  phone: "+6281110000004",
  password: hashPasswordForStorage("password123"),
  role: "mentor",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const DEVELOPER_USER: StoredUser = {
  id: "user-developer-seed",
  name: "Test Developer",
  email: "developer@test.dev",
  username: "test_developer",
  phone: "+6281110000005",
  password: hashPasswordForStorage("password123"),
  role: "developer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const SEED_USERS: StoredUser[] = [
  DEMO_USER,
  ADMIN_USER,
  LEARNER_USER,
  MENTOR_USER,
  DEVELOPER_USER,
];

function roleForEmail(email: string): UserRole {
  if (email === "admin@test.dev") return "admin";
  if (email === "developer@test.dev" || email.endsWith("@dev.bursa.dev")) return "developer";
  if (email === "mentor@test.dev" || email.endsWith("@mentor.bursa.dev")) return "mentor";
  return "learner";
}

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeUser(user: StoredUser): StoredUser {
  return {
    ...user,
    role: user.role ?? roleForEmail(user.email),
    password: normalizeStoredPassword(user.password),
  };
}

function notifyAuthChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function refreshAuth() {
  notifyAuthChange();
}

export function subscribeAuth(onStoreChange: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function readUsers(): StoredUser[] {
  if (!isBrowser()) return SEED_USERS;
  const raw = localStorage.getItem(USERS_KEY);
  if (raw && cachedUsersRaw === raw && cachedUsers) {
    return cachedUsers;
  }
  if (!raw) {
    const seeded = JSON.stringify(SEED_USERS);
    localStorage.setItem(USERS_KEY, seeded);
    cachedUsersRaw = seeded;
    cachedUsers = SEED_USERS;
    return SEED_USERS;
  }
  try {
    const users = (JSON.parse(raw) as StoredUser[]).map(normalizeUser);
    const merged = [...users];
    let changed = false;
    for (const seed of SEED_USERS) {
      const idx = merged.findIndex((u) => u.email === seed.email);
      if (idx < 0) {
        merged.push(seed);
        changed = true;
      } else {
        const current = merged[idx];
        const patched: StoredUser = {
          ...current,
          username: current.username ?? seed.username ?? null,
          phone: current.phone ?? seed.phone ?? null,
        };
        if (
          patched.username !== current.username ||
          patched.phone !== current.phone
        ) {
          merged[idx] = patched;
          changed = true;
        }
      }
    }
    const result = merged.length > 0 ? merged : SEED_USERS;
    if (changed) {
      writeUsers(result);
      return result;
    }
    cachedUsersRaw = raw;
    cachedUsers = result;
    return result;
  } catch {
    writeUsers(SEED_USERS);
    return SEED_USERS;
  }
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  const normalized = users.map((user) => ({
    ...user,
    password: normalizeStoredPassword(user.password),
  }));
  const raw = JSON.stringify(normalized);
  localStorage.setItem(USERS_KEY, raw);
  cachedUsersRaw = raw;
  cachedUsers = normalized;
}

function findStoredUserByIdentifier(identifier: string): StoredUser | undefined {
  const kind = classifyLoginIdentifier(identifier);
  const normalized = normalizeLoginIdentifier(identifier);
  const users = readUsers();

  if (kind === "email") {
    return users.find((u) => u.email === normalized);
  }
  if (kind === "phone") {
    return users.find((u) => u.phone === normalized);
  }
  return users.find((u) => u.username?.toLowerCase() === normalized);
}

function toSession(user: StoredUser): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    username: user.username ?? null,
    phone: user.phone ?? null,
    role: user.role ?? roleForEmail(user.email),
    issuedAt: new Date().toISOString(),
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
  };
}

export function getSession(): AuthSession | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === cachedSessionRaw) {
    return cachedSession;
  }
  if (!raw) {
    cachedSessionRaw = null;
    cachedSession = null;
    return null;
  }
  try {
    const session = JSON.parse(raw) as AuthSession;
    cachedSession = {
      ...session,
      role: session.role ?? roleForEmail(session.email),
      username: session.username ?? null,
      phone: session.phone ?? null,
      avatarUrl: session.avatarUrl ?? null,
      bio: session.bio ?? null,
    };
    touchDeviceSession(cachedSession.userId);
    cachedSessionRaw = raw;
    return cachedSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    cachedSessionRaw = null;
    cachedSession = null;
    return null;
  }
}

export function setSession(session: AuthSession | null) {
  if (!isBrowser()) return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    cachedSessionRaw = null;
    cachedSession = null;
    notifyAuthChange();
    return;
  }
  try {
    sessionStorage.removeItem(LOGOUT_FLAG_KEY);
  } catch {
    // ignore
  }
  const raw = JSON.stringify(session);
  localStorage.setItem(SESSION_KEY, raw);
  cachedSessionRaw = raw;
  cachedSession = session;
  notifyAuthChange();
}

function prismaRoleToClient(role: string): UserRole {
  const map: Record<string, UserRole> = {
    LEARNER: "learner",
    MENTOR: "mentor",
    ADMIN: "admin",
    DEVELOPER: "developer",
  };
  return map[role] ?? roleForEmail("");
}

/** Bridge Google OAuth (NextAuth) into localStorage session for prototype APIs. */
export function loginWithOAuth(input: {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  username?: string | null;
  phone?: string | null;
  role?: string;
}): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email.split("@")[0] || "Pengguna";
  const users = readUsers();
  const existingIdx = users.findIndex((u) => u.email === email);

  let user: StoredUser;
  if (existingIdx >= 0) {
    const existing = users[existingIdx];
    user = {
      ...existing,
      id: input.userId,
      name,
      username: input.username ?? existing.username ?? null,
      phone: input.phone ?? existing.phone ?? null,
      bio: input.bio ?? existing.bio ?? null,
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      role: input.role ? prismaRoleToClient(input.role) : existing.role,
    };
    const nextUsers = [...users];
    nextUsers[existingIdx] = user;
    writeUsers(nextUsers);
  } else {
    user = {
      id: input.userId,
      name,
      email,
      username: input.username ?? null,
      phone: input.phone ?? null,
      bio: input.bio ?? null,
      password: "",
      role: input.role ? prismaRoleToClient(input.role) : roleForEmail(email),
      createdAt: new Date().toISOString(),
      avatarUrl: input.avatarUrl ?? null,
    };
    writeUsers([...users, user]);
  }

  const session = toSession(user);
  const deviceResult = registerDeviceOnLogin(session.userId);
  if (!deviceResult.ok) {
    return { ok: false, error: deviceResult.error };
  }
  setSession(session);
  void ensurePrismaUser(session);
  return { ok: true, session };
}

export function login(
  input: LoginInput
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  // Sync entry — local fallback when API unavailable (offline dev).
  return loginLocal(input);
}

export async function loginWithServer(
  input: LoginInput
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      user?: {
        id: string;
        email: string;
        name: string;
        username?: string | null;
        phone?: string | null;
        role?: string;
        avatarUrl?: string | null;
        bio?: string | null;
      };
      error?: string;
    };

    if (res.ok && data.user) {
      return applyServerUserSession(data.user);
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Tidak dapat terhubung ke server. Coba lagi." };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Login gagal. Periksa email dan kata sandi Anda." };
  }

  return loginLocal(input);
}

function loginLocal(
  input: LoginInput
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const user = findStoredUserByIdentifier(input.identifier);

  if (!user) {
    return { ok: false, error: "Email, username, atau kata sandi salah." };
  }
  if (!verifyStoredPassword(user.password, input.password)) {
    return { ok: false, error: "Email, username, atau kata sandi salah." };
  }

  const session = toSession(user);
  const deviceResult = registerDeviceOnLogin(session.userId);
  if (!deviceResult.ok) {
    return { ok: false, error: deviceResult.error };
  }
  setSession(session);
  // Heal missing Prisma rows for older localStorage-only accounts.
  void ensurePrismaUser(session);
  return { ok: true, session };
}

function applyServerUserSession(apiUser: {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  role?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const email = apiUser.email.trim().toLowerCase();
  const users = readUsers();
  const existingIdx = users.findIndex((u) => u.email === email);
  const stored: StoredUser = {
    id: apiUser.id,
    name: apiUser.name,
    email,
    username: apiUser.username ?? null,
    phone: apiUser.phone ?? null,
    bio: apiUser.bio ?? null,
    password: existingIdx >= 0 ? users[existingIdx].password : "",
    role: apiUser.role ? prismaRoleToClient(apiUser.role) : roleForEmail(email),
    createdAt: existingIdx >= 0 ? users[existingIdx].createdAt : new Date().toISOString(),
    avatarUrl: apiUser.avatarUrl ?? null,
  };

  if (existingIdx >= 0) {
    const next = [...users];
    next[existingIdx] = stored;
    writeUsers(next);
  } else {
    writeUsers([...users, stored]);
  }

  const session = toSession(stored);
  const deviceResult = registerDeviceOnLogin(session.userId);
  if (!deviceResult.ok) {
    return { ok: false, error: deviceResult.error };
  }
  setSession(session);
  return { ok: true, session };
}

export async function registerWithServer(
  input: RegisterInput
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json().catch(() => ({}))) as {
      user?: {
        id: string;
        email: string;
        name: string;
        username?: string | null;
        phone?: string | null;
        role?: string;
        avatarUrl?: string | null;
        bio?: string | null;
      };
      error?: string;
    };

    if (res.ok && data.user) {
      return applyServerUserSession(data.user);
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Tidak dapat terhubung ke server. Coba lagi." };
    }
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Pendaftaran gagal. Coba lagi atau hubungi dukungan." };
  }

  return register(input);
}

export function register(
  input: RegisterInput
): { ok: true; session: AuthSession } | { ok: false; error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim().toLowerCase();
  const phone = input.phone?.trim() ? normalizeIndonesianPhone(input.phone.trim()) : undefined;

  if (name.length < 2) {
    return { ok: false, error: "Nama minimal 2 karakter." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Format email tidak valid." };
  }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { ok: false, error: "Username minimal 3 karakter (huruf kecil, angka, underscore)." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Kata sandi minimal 8 karakter." };
  }

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "Email sudah terdaftar. Silakan masuk." };
  }
  if (users.some((u) => u.username?.toLowerCase() === username)) {
    return { ok: false, error: "Username sudah dipakai. Pilih username lain." };
  }
  if (phone && users.some((u) => u.phone === phone)) {
    return { ok: false, error: "Nomor telepon sudah terdaftar." };
  }

  const newUser: StoredUser = {
    id: `user-${crypto.randomUUID()}`,
    name,
    email,
    username,
    phone: phone ?? null,
    password: hashPasswordForStorage(input.password),
    role: "learner",
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, newUser]);
  const session = toSession(newUser);
  const deviceResult = registerDeviceOnLogin(session.userId);
  if (!deviceResult.ok) {
    return { ok: false, error: deviceResult.error };
  }
  setSession(session);
  // Fire-and-forget: create matching Prisma User so chat/enroll APIs work immediately.
  void ensurePrismaUser(session);
  return { ok: true, session };
}

/** Ensure the client-auth session has a Prisma User row (idempotent). */
export async function ensurePrismaUser(
  session: Pick<AuthSession, "userId" | "email" | "name" | "role" | "username" | "phone">
): Promise<{ id: string } | null> {
  if (!isBrowser()) return null;
  try {
    const res = await fetch("/api/auth/ensure-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": session.email,
        "x-user-id": session.userId,
        ...(session.name ? { "x-user-name": session.name } : {}),
        ...(session.role ? { "x-user-role": session.role } : {}),
      },
      body: JSON.stringify({
        email: session.email,
        name: session.name,
        username: session.username ?? undefined,
        phone: session.phone ?? undefined,
        role: session.role,
        userId: session.userId,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: { id?: string } };
    return data.user?.id ? { id: data.user.id } : null;
  } catch {
    return null;
  }
}

export function isLogoutPending(): boolean {
  if (!isBrowser()) return false;
  try {
    return sessionStorage.getItem(LOGOUT_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearLogoutFlag(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(LOGOUT_FLAG_KEY);
  } catch {
    // ignore
  }
}

export async function logout(): Promise<void> {
  if (isBrowser()) {
    try {
      sessionStorage.setItem(LOGOUT_FLAG_KEY, "1");
      const url = new URL(window.location.href);
      if (url.searchParams.has("next")) {
        url.searchParams.delete("next");
      }
      if (url.searchParams.has("oauth")) {
        url.searchParams.delete("oauth");
      }
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // ignore
    }
  }
  setSession(null);
  if (!isBrowser()) return;
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // ignore — local session already cleared
  }
}

export function consumeLogoutFlag(): boolean {
  if (!isBrowser()) return false;
  try {
    if (sessionStorage.getItem(LOGOUT_FLAG_KEY) === "1") {
      sessionStorage.removeItem(LOGOUT_FLAG_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Persist profile fields on the local mock user + active session so navbar/chat
 * reflect name/avatar/bio immediately after a successful API save.
 */
export function updateLocalProfile(input: {
  name?: string;
  username?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}): AuthSession | null {
  const session = getSession();
  if (!session) return null;

  const users = readUsers();
  const idx = users.findIndex(
    (u) => u.email === session.email || u.id === session.userId
  );
  if (idx >= 0) {
    const nextUser: StoredUser = {
      ...users[idx],
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.username !== undefined ? { username: input.username } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
    };
    const nextUsers = [...users];
    nextUsers[idx] = nextUser;
    writeUsers(nextUsers);
  }

  const nextSession: AuthSession = {
    ...session,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.username !== undefined ? { username: input.username } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
  };
  setSession(nextSession);
  return nextSession;
}

/** Member-since date from local auth store (mock / client-side accounts). */
export function getStoredUserCreatedAt(email: string): string | null {
  if (!isBrowser()) return null;
  const user = readUsers().find((u) => u.email === email.trim().toLowerCase());
  return user?.createdAt ?? null;
}

export function getDemoCredentials() {
  return { identifier: DEMO_USER.email, password: "demo1234" };
}

export function getAdminCredentials() {
  return { email: ADMIN_USER.email, password: "password123" };
}

export function getMentorCredentials() {
  return { email: MENTOR_USER.email, password: "password123" };
}

export function getDeveloperCredentials() {
  return { email: DEVELOPER_USER.email, password: "password123" };
}

/** Sync localStorage mock password after server-side bcrypt reset. */
export function syncLocalPasswordAfterReset(email: string, newPassword: string) {
  if (!isBrowser()) return;
  const normalized = email.trim().toLowerCase();
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === normalized);
  if (idx < 0) return;
  const nextUsers = [...users];
  nextUsers[idx] = { ...nextUsers[idx], password: hashPasswordForStorage(newPassword) };
  writeUsers(nextUsers);
}
