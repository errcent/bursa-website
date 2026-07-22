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
  const computedSyncing = syncing || (pendingSync && !error);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7530/ingest/c33c766e-e1bb-4e60-96df-20dc44d9761c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "41a2dd" },
      body: JSON.stringify({
        sessionId: "41a2dd",
        runId: "pre-fix",
        hypothesisId: "H1-H4",
        location: "use-oauth-sync.ts:state",
        message: "oauth sync state snapshot",
        data: {
          pathname,
          nextAuthStatus,
          authLoading,
          hasLocalSession: Boolean(localSession || getSession()),
          oauthParam,
          logoutPending: isLogoutPending(),
          needsOAuthBridge,
          needsWebBridge,
          pendingSync,
          syncingState: syncing,
          computedSyncing,
          webBridgeExhausted,
          webBridgeAttempted: webBridgeAttemptedRef.current,
          hasError: Boolean(error),
          syncingRef: syncingRef.current,
          nextParam: searchParams.get("next"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [
    pathname,
    nextAuthStatus,
    authLoading,
    localSession,
    oauthParam,
    needsOAuthBridge,
    needsWebBridge,
    pendingSync,
    syncing,
    computedSyncing,
    error,
    webBridgeExhausted,
    searchParams,
  ]);
  // #endregion

  useEffect(() => {
    if (!pendingSync || syncingRef.current) return;

    // #region agent log
    fetch("http://127.0.0.1:7530/ingest/c33c766e-e1bb-4e60-96df-20dc44d9761c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "41a2dd" },
      body: JSON.stringify({
        sessionId: "41a2dd",
        runId: "post-fix",
        hypothesisId: needsOAuthBridge ? "H2" : "H1",
        location: "use-oauth-sync.ts:effect-start",
        message: "bridge effect started",
        data: { needsOAuthBridge, needsWebBridge, nextAuthStatus },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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
        // #region agent log
        fetch("http://127.0.0.1:7530/ingest/c33c766e-e1bb-4e60-96df-20dc44d9761c", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "41a2dd" },
          body: JSON.stringify({
            sessionId: "41a2dd",
            runId: "pre-fix",
            hypothesisId: needsOAuthBridge ? "H2" : "H1",
            location: "use-oauth-sync.ts:bridge-response",
            message: "bridge response received",
            data: {
              bridge: needsOAuthBridge ? "oauth" : "web",
              status: res.status,
              ok: res.ok,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!res.ok) {
          if (needsWebBridge) {
            // #region agent log
            fetch("http://127.0.0.1:7530/ingest/c33c766e-e1bb-4e60-96df-20dc44d9761c", {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "41a2dd" },
              body: JSON.stringify({
                sessionId: "41a2dd",
                runId: "pre-fix",
                hypothesisId: "H1",
                location: "use-oauth-sync.ts:web-bridge-401",
                message: "web bridge failed but pendingSync may remain true",
                data: { status: res.status },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
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
