"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import type { UserRole } from "@/lib/auth/types";

type RoleGuardProps = {
  children: React.ReactNode;
  allow: readonly UserRole[];
  loginNext?: string;
  loadingLabel?: string;
};

export function RoleGuard({
  children,
  allow,
  loginNext = "/",
  loadingLabel = "Memverifikasi akses...",
}: RoleGuardProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const allowed = Boolean(session && allow.includes(session.role));

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      // Prefer clean login URL; RoleGuard call sites already pass intentional loginNext.
      const next = loginNext === "/" ? undefined : loginNext;
      router.replace(next ? `/masuk?next=${encodeURIComponent(next)}` : "/masuk");
      return;
    }
    if (!allow.includes(session.role)) {
      router.replace("/");
    }
    // allow is a stable inline array of role literals at call sites
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, session, router, loginNext, allow.join(",")]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{loadingLabel}</p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
