"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { useAuth } from "@/components/auth-provider";
import {
  clearLogoutFlag,
  getSession,
  isLogoutPending,
  loginWithOAuth,
} from "@/lib/auth/client";
import {
  clearOAuthNext,
  readOAuthNext,
} from "@/lib/auth/oauth-redirect";
import { redirectAfterAuth, resolvePostAuthRedirect } from "@/lib/auth/redirect";

const AUTH_PATHS = new Set(["/masuk", "/daftar", "/auth/google-done"]);

async function fetchOAuthBridge(attempt = 0): Promise<Response> {
  const res = await fetch("/api/auth/oauth-bridge", { credentials: "include" });
  if (res.status === 401 && attempt < 8) {
    await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    return fetchOAuthBridge(attempt + 1);
  }
  return res;
}

async function fetchWebSessionBridge(): Promise<Response> {
  return fetch("/api/auth/web-session-bridge", { credentials: "include" });
}

type BridgeUser = {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role?: string;
};

function applyBridgeUser(user: BridgeUser) {
  const result = loginWithOAuth({
    userId: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    phone: user.phone,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result;
}

function stripOAuthParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * Legacy fallback for /masuk?oauth=sync URLs and web-session recovery.
 * Primary Google OAuth completion lives on /auth/google-done.
 */
export function useOAuthSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: nextAuthStatus } = useSession();
  const { session: localSession, isLoading: authLoading } = useAuth();
  const syncingRef = useRef(false);
  const webBridgeAttemptedRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webBridgeExhausted, setWebBridgeExhausted] = useState(false);

  if (pathname === "/auth/google-done") {
    return { syncing: false, error: null, isOAuthReturn: false };
  }

  const oauthParam = searchParams.get("oauth") === "sync";
  const onAuthPage = AUTH_PATHS.has(pathname);
  const nextAuthReady = nextAuthStatus !== "loading";

  const needsOAuthBridge =
    !authLoading &&
    !localSession &&
    !getSession() &&
    onAuthPage &&
    (oauthParam || (nextAuthReady && nextAuthStatus === "authenticated")) &&
    (!isLogoutPending() || oauthParam);

  const needsWebBridge =
    !webBridgeExhausted &&
    !webBridgeAttemptedRef.current &&
    !authLoading &&
    !localSession &&
    !getSession() &&
    onAuthPage &&
    !needsOAuthBridge &&
    nextAuthReady &&
    nextAuthStatus === "unauthenticated" &&
    Boolean(searchParams.get("next")) &&
    !isLogoutPending();

  const pendingSync = needsOAuthBridge || needsWebBridge;

  useEffect(() => {
    if (!pendingSync || syncingRef.current) return;

    if (oauthParam || nextAuthStatus === "authenticated") {
      clearLogoutFlag();
    }

    if (needsWebBridge) {
      webBridgeAttemptedRef.current = true;
    }

    syncingRef.current = true;
    setSyncing(true);
    setError(null);

    const next = readOAuthNext(searchParams.get("next"));
    const bridgeRequest = needsOAuthBridge ? fetchOAuthBridge() : fetchWebSessionBridge();

    void bridgeRequest
      .then(async (res) => {
        if (!res.ok) {
          if (needsWebBridge) {
            syncingRef.current = false;
            setSyncing(false);
            setWebBridgeExhausted(true);
            return null;
          }
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Sesi Google tidak valid.");
        }
        return res.json() as Promise<{ user: BridgeUser }>;
      })
      .then((data) => {
        if (!data) return;
        applyBridgeUser(data.user);
        stripOAuthParams();
        clearOAuthNext();
        redirectAfterAuth(resolvePostAuthRedirect(next));
      })
      .catch((err: Error) => {
        setError(err.message || "Gagal menyinkronkan sesi Google.");
        syncingRef.current = false;
        setSyncing(false);
      });
  }, [pendingSync, needsOAuthBridge, needsWebBridge, nextAuthStatus, oauthParam, searchParams]);

  return {
    syncing,
    error,
    isOAuthReturn: oauthParam,
  };
}
