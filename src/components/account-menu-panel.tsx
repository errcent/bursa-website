"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, GraduationCap, LayoutDashboard, LogOut, Shield } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  if (href.startsWith("/dashboard")) return <LayoutDashboard className="size-4 text-accent/80" />;
  if (href.startsWith("/admin")) return <Shield className="size-4 text-accent/80" />;
  if (href.startsWith("/mentor")) return <GraduationCap className="size-4 text-accent/80" />;
  return <Code2 className="size-4 text-accent/80" />;
}

type AccountMenuPanelProps = {
  align?: "start" | "end" | "center";
  className?: string;
  roleLinks?: RoleNavLink[];
};

export function AccountMenuPanel({
  align = "end",
  className,
  roleLinks = [],
}: AccountMenuPanelProps) {
  const { session, logout } = useAuth();
  const router = useRouter();

  if (!session) return null;

  const items = getAccountMenuItems(roleLinks);

  function handleLogout() {
    void logout().then(() => {
      router.replace("/masuk");
    });
  }

  return (
    <DropdownMenuContent
      align={align}
      sideOffset={8}
      className={cn(
        "w-64 overflow-hidden rounded-xl border border-accent/15 bg-popover/95 p-0 shadow-lg shadow-black/20 backdrop-blur-xl",
        className
      )}
    >
      <Link
        href="/profil"
        className="flex items-center gap-3 border-b border-border/60 bg-accent/5 px-3 py-3 transition-colors hover:bg-accent/10"
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
          <p className="mt-0.5 text-[11px] font-medium text-accent">Lihat profil</p>
        </div>
      </Link>

      <div className="py-1">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.href}
            className="mx-1 gap-2.5 rounded-lg px-2.5 py-1.5"
            render={<Link href={item.href} />}
          >
            {item.isRoleLink ? (
              <RoleMenuIcon href={item.href} />
            ) : (
              <item.icon className="size-4 text-accent/80" />
            )}
            <span className="text-sm font-medium">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </div>

      <DropdownMenuSeparator className="bg-border/60" />
      <DropdownMenuItem
        variant="destructive"
        className="mx-1 mb-1 gap-2.5 rounded-lg px-2.5 py-1.5"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
        <span className="text-sm font-medium">Keluar</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
