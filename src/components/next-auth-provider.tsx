"use client";

import { SessionProvider } from "next-auth/react";

/** Reduce session polling; 429 on /api/auth/session must not spam refetches. */
const SESSION_REFETCH_SEC = 5 * 60;

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={SESSION_REFETCH_SEC}>
      {children}
    </SessionProvider>
  );
}
