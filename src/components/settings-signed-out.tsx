"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { buildLoginHref } from "@/lib/auth/redirect";

export function SettingsSignedOut() {
  const { messages } = useLanguage();
  const t = messages.settings.account;
  const common = messages.common;

  return (
    <div className="surface-card mx-auto max-w-md px-6 py-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
        <Settings className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-5 font-heading text-lg font-semibold tracking-tight">{t.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.signedOutDescription}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button className="btn-primary" render={<Link href={buildLoginHref("/pengaturan")} />}>
          {common.signIn}
        </Button>
        <Button variant="outline" render={<Link href="/daftar" />}>
          {common.signUp}
        </Button>
      </div>
    </div>
  );
}
