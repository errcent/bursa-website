"use client";

import { useLanguage } from "@/components/language-provider";
import { AccessTierExplainer } from "@/components/auth/access-tier-explainer";

export function SettingsSignedOut() {
  const { messages } = useLanguage();
  const t = messages.settings.account;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start py-6 sm:py-10">
      <p className="eyebrow mb-2">Akun</p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        {t.title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
        {t.signedOutDescription}
      </p>
      <AccessTierExplainer returnPath="/pengaturan" />
    </div>
  );
}
