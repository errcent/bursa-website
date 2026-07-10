"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AccountMenuPanel } from "@/components/account-menu-panel";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buildLoginHref, buildRegisterHref, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { getRoleNavLinks } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type SiteNavAuthProps = {
  /** @deprecated Mobile account links are rendered in the drawer body via AccountMenuMobileLinks */
  mobileMenu?: boolean;
};

export function SiteNavAuth({ mobileMenu = false }: SiteNavAuthProps) {
  const { session, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathWithQuery = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
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

  if (mobileMenu) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-border outline-none transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-ring"
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
      </DropdownMenuTrigger>
      <AccountMenuPanel roleLinks={roleLinks} />
    </DropdownMenu>
  );
}
