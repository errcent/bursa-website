"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AccountMenuPanel } from "@/components/account-menu-panel";
import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { buildLoginHref, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { EXISTING_ACCOUNT_PROMPT } from "@/lib/features/registration-copy";
import { getRoleNavLinks } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const GUEST_PRIMARY_HREF = "/waitlist";
const GUEST_PRIMARY_LABEL = "Gabung Waitlist";
const GUEST_PRIMARY_HINT = "Segera hadir";

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
          <Button
            size="sm"
            className="btn-primary h-auto min-h-11 w-full flex-col items-start justify-center gap-0.5 py-2"
            render={<Link href={GUEST_PRIMARY_HREF} />}
          >
            <span className="text-[10px] font-normal uppercase tracking-wide opacity-80">
              {GUEST_PRIMARY_HINT}
            </span>
            {GUEST_PRIMARY_LABEL}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {EXISTING_ACCOUNT_PROMPT}{" "}
            <Link href={loginHref} className="link-accent font-medium">
              Masuk
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Button
          size="sm"
          className="btn-primary h-auto min-h-8 flex-col gap-0 px-3 py-1.5"
          render={<Link href={GUEST_PRIMARY_HREF} title={`${GUEST_PRIMARY_HINT} — early access terbatas`} />}
        >
          <span className="text-[9px] font-normal uppercase leading-none tracking-wide opacity-80">
            {GUEST_PRIMARY_HINT}
          </span>
          <span className="text-xs leading-tight">{GUEST_PRIMARY_LABEL}</span>
        </Button>
        <Link
          href={loginHref}
          className="hidden text-xs text-muted-foreground hover:text-foreground md:inline"
        >
          {EXISTING_ACCOUNT_PROMPT}{" "}
          <span className="font-medium text-foreground">Masuk</span>
        </Link>
      </div>
    );
  }

  if (mobileMenu) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex size-9 items-center justify-center rounded-md border border-border outline-none transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-ring"
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
