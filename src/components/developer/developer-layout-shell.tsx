"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { DeveloperSidebar } from "@/components/developer/developer-sidebar";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/developer", label: "QC Hub" },
  { href: "/developer/docs", label: "Dokumentasi" },
];

export function DeveloperLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();

  return (
    <RoleGuard
      allow={["developer"]}
      loginNext="/developer"
      loadingLabel="Memverifikasi akses developer..."
    >
      <div className="flex min-h-screen bg-background text-foreground">
        <DeveloperSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6">
            <div>
              <p className="text-xs text-muted-foreground">Developer workspace</p>
              <p className="font-heading text-sm font-semibold sm:text-base">
                {session?.name ?? "Developer"}
              </p>
            </div>
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    aria-label="Menu developer"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[280px] flex-col p-0 lg:hidden">
                <SheetHeader className="border-b border-border">
                  <SheetTitle>Developer</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-1 flex-col gap-1 p-3">
                  {mobileLinks.map((link) => (
                    <SheetClose
                      key={link.href}
                      render={
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-11 w-full justify-start",
                            pathname === link.href || pathname.startsWith(`${link.href}/`)
                              ? "bg-muted"
                              : undefined
                          )}
                          render={<Link href={link.href} />}
                        />
                      }
                    >
                      {link.label}
                    </SheetClose>
                  ))}
                </nav>
                <div className="border-t border-border p-4">
                  <SheetClose
                    nativeButton={false}
                    render={
                      <Link
                        href="/"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      />
                    }
                  >
                    ← Kembali ke situs
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
