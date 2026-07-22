"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Home,
  Receipt,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const tabs: Array<{
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  external?: boolean;
}> = [
  { href: "/instruktur-dashboard", label: "Beranda", icon: Home, exact: true },
  { href: "/instruktur-dashboard/course", label: "Course", icon: BookOpen },
  { href: "/instruktur-dashboard/transaksi", label: "Transaksi", icon: Receipt },
  { href: "/instruktur-dashboard/profil", label: "Profil", icon: UserRound },
  { href: "/mentor/usulan", label: "Usulan Konten", icon: ClipboardList, external: true },
];

function isTabActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InstrukturDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace(`/masuk?next=${encodeURIComponent("/instruktur-dashboard")}`);
      return;
    }
    if (session.role !== "mentor") {
      router.replace("/dashboard");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session || session.role !== "mentor") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Memverifikasi akses mentor...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border px-4 py-4 md:px-6">
        <p className="text-xs text-muted-foreground">Dashboard Instruktur</p>
        <h1 className="font-heading text-lg font-semibold">{session.name}</h1>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(pathname, tab.href, tab.exact);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(pathname, tab.href, tab.exact);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
