"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2, GraduationCap, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildLoginHref, buildRegisterHref, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { getRoleNavLinks } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function RoleMenuIcon({ href }: { href: string }) {
  if (href.startsWith("/dashboard")) return <LayoutDashboard className="size-4" />;
  if (href.startsWith("/admin")) return <Shield className="size-4" />;
  if (href.startsWith("/mentor")) return <GraduationCap className="size-4" />;
  return <Code2 className="size-4" />;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type SiteNavAuthProps = {
  mobileMenu?: boolean;
};

export function SiteNavAuth({ mobileMenu = false }: SiteNavAuthProps) {
  const { session, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathWithQuery = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  // Login may return to deep links; register always starts at beranda.
  // Never pass /dashboard or /pengaturan as sticky next across accounts.
  const loginHref = buildLoginHref(currentPathWithQuery || POST_AUTH_HOME);
  const registerHref = buildRegisterHref();
  const roleLinks = getRoleNavLinks(session?.role);

  if (isLoading) {
    if (mobileMenu) {
      return <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />;
    }

    return <div className="hidden h-8 w-20 animate-pulse rounded-lg bg-muted sm:block" />;
  }

  if (!session) {
    if (mobileMenu) {
      return (
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="h-11 w-full justify-start" render={<Link href={loginHref} />}>
            Masuk
          </Button>
          <Button size="sm" className="btn-primary h-11 w-full justify-start" render={<Link href={registerHref} />}>
            Daftar Gratis
          </Button>
        </div>
      );
    }

    return (
      <>
        <Button variant="outline" size="sm" render={<Link href={loginHref} />}>
          Masuk
        </Button>
        <Button size="sm" className="btn-primary hidden sm:inline-flex" render={<Link href={registerHref} />}>
          Daftar Gratis
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center justify-center rounded-full border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring",
          mobileMenu ? "h-11 w-full justify-start gap-2 rounded-lg px-3" : "size-9"
        )}
        aria-label={`Menu akun ${session.name}`}
      >
        <Avatar className="size-8">
          {session.avatarUrl && (
            <AvatarImage src={session.avatarUrl} alt={session.name} />
          )}
          <AvatarFallback className="bg-surface text-xs font-medium">
            {initials(session.name)}
          </AvatarFallback>
        </Avatar>
        {mobileMenu && <span className="text-sm font-medium">Menu akun</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={mobileMenu ? "start" : "end"} className="w-52">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{session.name}</p>
          <p className="truncate text-xs text-muted-foreground">{session.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </DropdownMenuItem>
        {roleLinks
          .filter((link) => link.href !== "/dashboard")
          .map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
            <RoleMenuIcon href={link.href} />
            {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem render={<Link href="/pengaturan#profil" />}>
          <Settings className="size-4" />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            logout();
            router.push("/masuk");
            router.refresh();
          }}
        >
          <LogOut className="size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
