export type UserRole = "learner" | "mentor" | "admin" | "developer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  role: UserRole;
  issuedAt: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface StoredUser extends AuthUser {
  /** Mock only — jangan simpan password plain di produksi. */
  password: string;
}

export interface LoginInput {
  /** Username, email, or phone number. */
  identifier: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  username: string;
  phone?: string;
  password: string;
}
