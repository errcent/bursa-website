import { Mail } from "lucide-react";

import type { LegalLocale } from "@/lib/hosts/hosts";
import { trustCopy, trustPortalHrefs } from "@/lib/trust/public-posture";

export function TrustHero({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);

  return (
    <div className="trust-hero">
      <div className="container-page py-12 sm:py-16">
        <p className="trust-mono mb-4 text-[11px] uppercase tracking-[0.22em] text-primary">{t.lastPublished}</p>
        <h1 className="trust-serif max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t.product}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/90 text-pretty">{t.heroLead}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">{t.heroBody}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <a
            href={`mailto:${t.securityEmail}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-primary"
          >
            <Mail className="size-3.5" aria-hidden />
            {t.securityEmail}
          </a>
          <a href={hrefs.privacyPolicy} className="text-muted-foreground hover:text-foreground">
            {t.privacyLink}
          </a>
        </div>
      </div>
    </div>
  );
}
