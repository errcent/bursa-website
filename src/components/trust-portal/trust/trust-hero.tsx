import { Mail } from "lucide-react";

import type { LegalLocale } from "@/lib/hosts/hosts";
import { trustCopy, trustPortalHrefs } from "@/lib/trust/public-posture";

export function TrustHero({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);

  return (
    <div className="hero-cinematic page-header-strip trust-hero border-b border-border/40">
      <div className="container-page py-12 sm:py-16">
        <p className="eyebrow mb-3">{t.lastPublished}</p>
        <h1 className="page-hero-title max-w-3xl text-balance text-gradient">{t.product}</h1>
        <p className="section-copy mt-4 max-w-2xl text-pretty">{t.heroLead}</p>
        <p className="section-copy mt-3 max-w-2xl text-pretty">{t.heroBody}</p>
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
