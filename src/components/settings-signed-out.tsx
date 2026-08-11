"use client";

import Link from "next/link";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { buildLoginHref } from "@/lib/auth/redirect";

export function SettingsSignedOut() {
  const { messages } = useLanguage();
  const t = messages.settings.account;
  const common = messages.common;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start py-6 sm:py-10">
      <p className="eyebrow mb-2">Akun</p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
        {t.signedOutDescription}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button className="btn-primary h-11 min-w-[9rem]" render={<Link href={buildLoginHref("/pengaturan")} />}>
          {common.signIn}
        </Button>
        <Button
          variant="outline"
          className="h-11 border-border/70 bg-transparent"
          render={<Link href="/daftar" />}
        >
          {common.signUp}
        </Button>
      </div>
    </div>
  );
}
