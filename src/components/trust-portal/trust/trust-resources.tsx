import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { LegalLocale } from "@/lib/hosts/hosts";
import {
  EXTERNAL_RESOURCES,
  RESOURCES,
  trustCopy,
  trustPortalHrefs,
} from "@/lib/trust/public-posture";

import { TrustRequestForm } from "./trust-request-form";

export function TrustResources({
  locale,
  preview = false,
}: {
  locale: LegalLocale;
  preview?: boolean;
}) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);
  const items = preview ? RESOURCES.slice(0, 4) : RESOURCES;

  return (
    <div className="flex flex-col gap-8">
      {!preview && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.resourcesLead}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.hrefKey} href={hrefs[item.hrefKey]} className="trust-card group p-5 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-3">
              <h3 className="trust-serif text-lg font-semibold">
                {locale === "en" ? item.enTitle : item.idTitle}
              </h3>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {locale === "en" ? item.enBody : item.idBody}
            </p>
          </Link>
        ))}
      </div>
      {!preview && (
        <>
          <section>
            <h3 className="trust-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {locale === "en" ? "Legal & privacy" : "Legal & privasi"}
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {EXTERNAL_RESOURCES.map((item) => (
                <li key={item.key}>
                  <Link href={hrefs[item.key]} className="text-sm text-foreground hover:text-primary">
                    {locale === "en" ? item.enTitle : item.idTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <TrustRequestForm locale={locale} />
        </>
      )}
    </div>
  );
}
