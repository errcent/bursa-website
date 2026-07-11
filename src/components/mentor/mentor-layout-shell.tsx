"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { MentorSidebar } from "@/components/mentor/mentor-sidebar";
import { QcBanner } from "@/components/qc-banner";
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
import { canMutateMentor } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/mentor", label: "Ringkasan" },
  { href: "/mentor/usulan", label: "Usulan Konten" },
  { href: "/mentor/chat", label: "Group Chat" },
  { href: "/mentor/profil", label: "Identitas Mentor" },
  { href: "/mentor/pengaturan", label: "Pengaturan" },
];

export function MentorLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);

  return (
    <RoleGuard allow={["mentor", "developer"]} loginNext="/mentor" loadingLabel="Memverifikasi akses mentor...">
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <QcBanner panelLabel="Mentor Panel" />
        <div className="flex min-h-0 flex-1">
          <MentorSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6">
              <div>
                <p className="text-xs text-muted-foreground">Panel mentor</p>
                <p className="font-heading text-sm font-semibold sm:text-base">
                  {session?.name ?? "Mentor"}
                  {readOnly && (
                    <span className="ml-2 text-xs font-normal text-amber">
                      (QC — hanya lihat)
                    </span>
                  )}
                </p>
              </div>
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Menu mentor" />
                  }
                >
                  <Menu className="size-4" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 lg:hidden">
                  <SheetHeader className="border-b border-border">
                    <SheetTitle>Mentor Panel</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-3">
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
                </SheetContent>
              </Sheet>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
