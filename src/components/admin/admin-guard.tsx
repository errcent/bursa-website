"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { canAccessAdminPanel } from "@/lib/auth/roles";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const allowed = canAccessAdminPanel(session?.role);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/masuk?next=/admin");
      return;
    }
    if (!canAccessAdminPanel(session.role)) {
      router.replace("/");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <p className="text-sm text-muted-foreground">Memverifikasi akses admin...</p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
