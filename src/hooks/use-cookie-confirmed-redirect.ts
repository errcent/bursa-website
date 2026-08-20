"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { fetchWebSessionUser, isLogoutPending, setSession } from "@/lib/auth/client";
import { redirectAfterAuth } from "@/lib/auth/redirect";

/**
 * Auto-redirect off /masuk|/daftar only when localStorage session AND the
 * httpOnly web-session cookie are both valid. Stale local-only sessions are cleared
 * so guarded routes like /admin cannot ping-pong with ?next=.
 */
export function useCookieConfirmedRedirect(next: string) {
  const { session, isLoading } = useAuth();
  const [cookieRejected, setCookieRejected] = useState(false);

  useEffect(() => {
    if (isLoading || isLogoutPending()) return;
    if (!session) {
      setCookieRejected(true);
      return;
    }

    let cancelled = false;
    setCookieRejected(false);
    void fetchWebSessionUser().then((user) => {
      if (cancelled) return;
      if (user) {
        redirectAfterAuth(next);
        return;
      }
      setSession(null);
      setCookieRejected(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, session, next]);

  return {
    redirecting: Boolean(!isLoading && session && !cookieRejected && !isLogoutPending()),
  };
}
