"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { SettingsShell } from "@/components/settings-shell";

function SettingsShellFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[13.75rem_minmax(0,1fr)]">
      <div className="hidden h-48 animate-pulse rounded-2xl bg-muted lg:block" />
      <div className="h-96 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

export function SettingsPageContent() {
  const { messages } = useLanguage();

  return (
    <>
      <div className="border-b border-border/40 bg-surface/20">
        <div className="container-page py-6 sm:py-8">
          <Link
            href="/dashboard"
            className="link-muted mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            {messages.common.back}
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {messages.settings.pageTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            {messages.settings.description}
          </p>
        </div>
      </div>

      <div className="container-page section-tight py-8 sm:py-10">
        <Suspense fallback={<SettingsShellFallback />}>
          <SettingsShell />
        </Suspense>
      </div>
    </>
  );
}
