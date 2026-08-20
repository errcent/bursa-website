"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { fetchWebSessionUser, hydrateSessionFromWebBridge } from "@/lib/auth/client";
import { canAccessAdminPanel } from "@/lib/auth/roles";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [bridging, setBridging] = useState(!session);
  const allowed = canAccessAdminPanel(session?.role);

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      setBridging(false);
      if (!canAccessAdminPanel(session.role)) {
        router.replace("/");
      }
      return;
    }

    let cancelled = false;
    setBridging(true);
    void fetchWebSessionUser().then((user) => {
      if (cancelled) return;
      if (user) {
        const applied = hydrateSessionFromWebBridge(user);
        if (!applied.ok) {
          setBridging(false);
          router.replace("/masuk?next=/admin");
        }
        return;
      }
      setBridging(false);
      router.replace("/masuk?next=/admin");
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, session, router]);

  if (isLoading || bridging || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Memverifikasi akses admin...</p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
