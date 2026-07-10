"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { consumeLogoutFlag } from "@/lib/auth/client";
import { buildLoginHref, POST_AUTH_HOME, resolvePostAuthRedirect } from "@/lib/auth/redirect";

export function AuthGuard({
  children,
  redirectTo = "/masuk",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      // Logout should always leave protected shells for login, never sticky next.
      if (consumeLogoutFlag()) {
        router.replace("/masuk");
        return;
      }
      const current =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : POST_AUTH_HOME;
      // Only preserve deep-link return paths; never sticky /dashboard across accounts.
      const href =
        redirectTo === "/masuk"
          ? buildLoginHref(current)
          : (() => {
              const next = resolvePostAuthRedirect(current);
              return next === POST_AUTH_HOME
                ? redirectTo
                : `${redirectTo}?next=${encodeURIComponent(next)}`;
            })();
      router.replace(href);
    }
  }, [isLoading, session, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Memuat sesi...</p>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
