import Link from "next/link";

import type { LegalLocale } from "@/lib/hosts/hosts";
import {
  COMMITMENTS,
  FRAMEWORKS,
  frameworkStampClass,
  trustCopy,
  trustPortalHrefs,
} from "@/lib/trust/public-posture";

import { TrustControls } from "./trust-controls";
import { TrustResources } from "./trust-resources";

export function TrustOverview({ locale }: { locale: LegalLocale }) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="trust-card px-5 py-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
        {t.privacyStatement}
      </section>

      <section>
        <h2 className="trust-serif text-2xl font-semibold">{t.commitmentsTitle}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {COMMITMENTS.map((item) => (
            <article key={item.id} className="border-t border-border/70 pt-4">
              <h3 className="text-sm font-medium text-foreground">
                {locale === "en" ? item.enLabel : item.idLabel}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {locale === "en" ? item.enBody : item.idBody}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="trust-serif text-2xl font-semibold">{t.frameworksTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.frameworksLead}</p>
            </div>
            <Link href={hrefs.compliance} className="trust-mono text-[11px] uppercase tracking-[0.14em] text-primary hover:text-[#d4b88a]">
              {t.viewAll}
            </Link>
          </div>
          <div className="trust-card divide-y divide-border/60">
            {FRAMEWORKS.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{locale === "en" ? item.enName : item.idName}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {locale === "en" ? item.enNote : item.idNote}
                  </p>
                </div>
                <span className={frameworkStampClass(item.status)}>
                  {locale === "en" ? item.enStatus : item.idStatus}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="trust-serif text-2xl font-semibold">{t.controls}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.controlsLead}</p>
            </div>
            <Link href={hrefs.controls} className="trust-mono text-[11px] uppercase tracking-[0.14em] text-primary hover:text-[#d4b88a]">
              {t.viewAll}
            </Link>
          </div>
          <TrustControls locale={locale} preview />
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="trust-serif text-2xl font-semibold">{t.resources}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.resourcesLead}</p>
          </div>
          <Link href={hrefs.resources} className="trust-mono text-[11px] uppercase tracking-[0.14em] text-primary hover:text-[#d4b88a]">
            {t.viewAll}
          </Link>
        </div>
        <TrustResources locale={locale} preview />
      </section>
    </div>
  );
}
