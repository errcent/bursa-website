"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  BadgeCheck,
  ChevronRight,
  Lock,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getStoredUserCreatedAt } from "@/lib/auth/client";
import { buildLoginHref } from "@/lib/auth/redirect";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const FIELD_INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60";

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
    month: "long",
    year: "numeric",
  });
}

function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-copy mt-1">{description}</p>}
      </div>
      {children}
    </section>
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
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <section className="surface-card p-5">
        <h2 className="section-title text-base">{t.title}</h2>
        <p className="section-copy mt-2">{t.signedOutDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="lg"
            variant="outline"
            className="min-h-11"
            render={<Link href={buildLoginHref("/pengaturan")} />}
          >
            {common.signIn}
          </Button>
          <Button size="lg" className="btn-primary min-h-11" render={<Link href="/daftar" />}>
            {common.signUp}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <SettingsSection title={t.profileTitle} description={t.profileDescription}>
        <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="!size-14 shrink-0">
              {session.avatarUrl && (
                <AvatarImage src={session.avatarUrl} alt={session.name || "Foto profil"} />
              )}
              <AvatarFallback>{initials(session.name || "U")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session.name || "Pengguna"}</p>
              {session.username && (
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  @{session.username}
                </p>
              )}
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{session.email}</p>
              {session.bio && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{session.bio}</p>
              )}
            </div>
          </div>
          <Link
            href="/profil"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 w-full shrink-0 sm:w-auto"
            )}
          >
            <UserRound className="size-4" />
            {common.editProfile}
            <ChevronRight className="size-4 opacity-60" />
          </Link>
        </div>
      </SettingsSection>

      <SettingsSection title={t.accountInfoTitle} description={t.accountInfoDescription}>
        <div className="surface-card divide-y divide-border/60 p-5">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                <AtSign className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Username</p>
                <p className="mt-1 font-mono text-sm">
                  {session.username ? `@${session.username}` : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dipakai untuk masuk dan mention di chat.
                </p>
              </div>
            </div>
            <Link
              href="/profil"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full shrink-0 sm:w-auto"
              )}
            >
              {common.editProfile}
            </Link>
          </div>

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                <Phone className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Nomor telepon</p>
                <p className="mt-1 font-mono text-sm">{session.phone ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opsional — bisa dipakai untuk masuk.
                </p>
              </div>
            </div>
            <Link
              href="/profil"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full shrink-0 sm:w-auto"
              )}
            >
              {common.editProfile}
            </Link>
          </div>

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                <Mail className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{common.email}</p>
                <p className="mt-1 font-mono text-sm">{session.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.emailHint}</p>
              </div>
            </div>
            <Button
              size="lg"
              variant="outline"
              disabled
              className="min-h-11 w-full shrink-0 opacity-60 sm:w-auto"
            >
              {t.changeEmail}
            </Button>
          </div>

          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                <BadgeCheck className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t.accountStatus}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="accent" className="rounded-full px-3 py-1 text-xs">
                    {common.active}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {ROLE_LABELS[session.role]}
                  </Badge>
                </div>
              </div>
            </div>
            {memberSince && (
              <p className="text-xs text-muted-foreground sm:text-right">
                {t.memberSince}{" "}
                <span className="font-medium text-foreground">
                  {formatMemberSince(memberSince, locale)}
                </span>
              </p>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={t.passwordTitle} description={t.passwordDescription}>
        <div className="surface-card space-y-4 p-5">
          {!showPasswordForm ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground">
                  <Lock className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{common.password}</p>
                  <p className="mt-1 font-mono text-xs tracking-widest text-muted-foreground">
                    {t.passwordMasked}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.passwordLastUpdated}</p>
                </div>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setShowPasswordForm(true)}
              >
                {t.changePassword}
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t.currentPassword}
                </span>
                <input
                  type="password"
                  disabled
                  autoComplete="current-password"
                  placeholder={t.currentPasswordPlaceholder}
                  className={FIELD_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t.newPassword}</span>
                <input
                  type="password"
                  disabled
                  autoComplete="new-password"
                  placeholder={t.newPasswordPlaceholder}
                  className={FIELD_INPUT_CLASS}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {t.confirmPassword}
                </span>
                <input
                  type="password"
                  disabled
                  autoComplete="new-password"
                  placeholder={t.confirmPasswordPlaceholder}
                  className={FIELD_INPUT_CLASS}
                />
              </label>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  size="lg"
                  className="btn-primary min-h-11 w-full opacity-50 sm:w-auto"
                  disabled
                >
                  {t.savePassword}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => setShowPasswordForm(false)}
                >
                  {t.cancel}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t.passwordPrototypeNote}</p>
            </form>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title={t.dangerZoneTitle}>
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 space-y-4">
              <p className="text-xs text-muted-foreground">{t.dangerZoneDescription}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  size="lg"
                  variant="outline"
                  disabled
                  className="min-h-11 w-full border-destructive/30 text-destructive opacity-60 sm:w-auto"
                >
                  {t.deactivateAccount}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled
                  className="min-h-11 w-full opacity-60 sm:w-auto"
                >
                  {t.deleteAccount}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">{t.openProfileTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.openProfileDescription}</p>
        </div>
        <Link
          href="/profil"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "min-h-11 w-full sm:w-auto"
          )}
        >
          {t.openProfile}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
