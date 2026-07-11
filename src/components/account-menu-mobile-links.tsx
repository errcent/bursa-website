"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, GraduationCap, LayoutDashboard, LogOut, Shield } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RoleNavLink } from "@/lib/auth/roles";
import { getAccountMenuItems } from "@/lib/nav/account-menu";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function RoleMenuIcon({ href }: { href: string }) {
  if (href.startsWith("/dashboard")) return <LayoutDashboard className="size-4 opacity-70" />;
  if (href.startsWith("/admin")) return <Shield className="size-4 opacity-70" />;
  if (href.startsWith("/mentor")) return <GraduationCap className="size-4 opacity-70" />;
  return <Code2 className="size-4 opacity-70" />;
}

type AccountMenuMobileLinksProps = {
  roleLinks?: RoleNavLink[];
  onNavigate?: () => void;
  linkClassName?: string;
  className?: string;
};

export function AccountMenuMobileLinks({
  roleLinks = [],
  onNavigate,
  linkClassName,
  className,
}: AccountMenuMobileLinksProps) {
  const { session, logout } = useAuth();
  const router = useRouter();

  if (!session) return null;

  const items = getAccountMenuItems(roleLinks);

  function handleLogout() {
    logout();
    onNavigate?.();
    router.push("/masuk");
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Link
        href="/profil"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl border border-accent/15 bg-accent/5 px-4 py-3 transition-colors hover:bg-accent/10"
      >
        <Avatar className="size-10 ring-2 ring-accent/20">
          {session.avatarUrl && (
            <AvatarImage src={session.avatarUrl} alt={session.name} />
          )}
          <AvatarFallback className="bg-surface text-sm font-medium">
            {initials(session.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{session.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.email}</p>
        </div>
      </Link>

      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "mobile-nav-item gap-3 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              linkClassName
            )}
          >
            {item.isRoleLink ? (
              <RoleMenuIcon href={item.href} />
            ) : (
              <item.icon className="size-4 opacity-70" />
            )}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <Button
        variant="outline"
        className="h-11 w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
        Keluar
      </Button>
    </div>
  );
}
