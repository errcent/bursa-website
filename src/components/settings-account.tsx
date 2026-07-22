"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getStoredUserCreatedAt } from "@/lib/auth/client";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getConsumerRoleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const FIELD_INPUT_CLASS =
  "min-h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMemberSince(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InfoRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm">{value}</p>
      </div>
      {action}
    </div>
  );
}

export function SettingsAccount() {
  const { session, isLoading } = useAuth();
  const { locale, messages } = useLanguage();
  const t = messages.settings.account;
  const common = messages.common;
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const memberSince = useMemo(() => {
    if (!session?.email) return null;
    return getStoredUserCreatedAt(session.email);
  }, [session?.email]);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session) {
    return (
      <section className="surface-card p-5">
        <p className="text-sm text-muted-foreground">{t.signedOutDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" render={<Link href={buildLoginHref("/pengaturan")} />}>
            {common.signIn}
          </Button>
          <Button size="sm" className="btn-primary" render={<Link href="/daftar" />}>
            {common.signUp}
          </Button>
        </div>
      </section>
    );
  }

  const roleLabel = session ? getConsumerRoleLabel(session.role) : null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">{t.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.signedInDescription}</p>
      </div>

      <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="!size-12 shrink-0">
            {session.avatarUrl && (
              <AvatarImage src={session.avatarUrl} alt={session.name || "Foto profil"} />
            )}
            <AvatarFallback>{initials(session.name || "U")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session.name || "Pengguna"}</p>
            {session.username && (
              <p className="truncate font-mono text-xs text-muted-foreground">@{session.username}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {roleLabel ? (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                  {roleLabel}
                </Badge>
              ) : null}
              {memberSince && (
                <span className="text-[10px] text-muted-foreground">
                  {t.memberSince} {formatMemberSince(memberSince, locale)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/profil"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          {common.editProfile}
        </Link>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t.accountInfoTitle}
        </h3>
        <div className="surface-card divide-y divide-border/60 px-4">
        <InfoRow
          label={common.email}
          value={session.email}
          action={
            <Button size="sm" variant="outline" disabled className="opacity-60">
              {t.changeEmail}
            </Button>
          }
        />
        <InfoRow
          label="Username"
          value={session.username ? `@${session.username}` : "—"}
        />
        <InfoRow label="Telepon" value={session.phone ?? "—"} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t.passwordTitle}
        </h3>
        <div className="surface-card p-4">
        {!showPasswordForm ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <span className="text-sm">{common.password}</span>
              <span className="font-mono text-xs tracking-widest text-muted-foreground">
                {t.passwordMasked}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowPasswordForm(true)}>
              {t.changePassword}
            </Button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <input type="password" disabled placeholder={t.currentPasswordPlaceholder} className={FIELD_INPUT_CLASS} />
            <input type="password" disabled placeholder={t.newPasswordPlaceholder} className={FIELD_INPUT_CLASS} />
            <input type="password" disabled placeholder={t.confirmPasswordPlaceholder} className={FIELD_INPUT_CLASS} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="btn-primary opacity-50" disabled>
                {t.savePassword}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                {t.cancel}
              </Button>
            </div>
          </form>
        )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t.dangerZoneTitle}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">{t.dangerZoneDescription}</p>
        <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled className="border-destructive/30 text-destructive opacity-60">
          {t.deactivateAccount}
        </Button>
        <Button size="sm" variant="destructive" disabled className="opacity-60">
          {t.deleteAccount}
        </Button>
        </div>
      </div>
    </section>
  );
}
