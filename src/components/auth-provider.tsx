"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  refreshAuth,
  subscribeAuth,
  updateLocalProfile as updateLocalProfileRequest,
} from "@/lib/auth/client";
import type { AuthSession, LoginInput, RegisterInput } from "@/lib/auth/types";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => { ok: true } | { ok: false; error: string };
  register: (input: RegisterInput) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  refresh: () => void;
  updateLocalProfile: (input: {
    name?: string;
    username?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  }) => AuthSession | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getClientSession(): AuthSession | null {
  return getSession();
}

function getServerSession(): AuthSession | null {
  return null;
}

function getClientHydrated(): boolean {
  return true;
}

function getServerHydrated(): boolean {
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribeAuth, getClientSession, getServerSession);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    getClientHydrated,
    getServerHydrated
  );
  const isLoading = !isHydrated;

  const refresh = useCallback(() => {
    refreshAuth();
  }, []);

  const login = useCallback((input: LoginInput) => {
    const result = loginRequest(input);
    if (!result.ok) return result;
    return { ok: true as const };
  }, []);

  const register = useCallback((input: RegisterInput) => {
    const result = registerRequest(input);
    if (!result.ok) return result;
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
  }, []);

  const updateLocalProfile = useCallback(
    (input: {
      name?: string;
      username?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
    }) => updateLocalProfileRequest(input),
    []
  );

  const value = useMemo(
    () => ({ session, isLoading, login, register, logout, refresh, updateLocalProfile }),
    [session, isLoading, login, register, logout, refresh, updateLocalProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return ctx;
}
