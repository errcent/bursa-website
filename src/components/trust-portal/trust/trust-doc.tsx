import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MarkdownDocument } from "@/components/trust-portal/markdown-document";
import type { LegalLocale } from "@/lib/hosts/hosts";
import type { PublicDocumentRecord } from "@/lib/public-documents/types";
import { trustCopy, trustPortalHrefs } from "@/lib/trust/public-posture";

import { TrustPageHeader } from "./trust-shell";

export function TrustDocArticle({
  doc,
  locale,
}: {
  doc: PublicDocumentRecord;
  locale: LegalLocale;
}) {
  const t = trustCopy(locale);
  const hrefs = trustPortalHrefs(locale);

  return (
    <>
      <TrustPageHeader title={doc.title} description={doc.description} />
      <div className="container-page pb-16 pt-8">
        <Link
          href={hrefs.hub}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.back}
        </Link>
        <MarkdownDocument markdown={doc.markdownBody} locale={locale} />
      </div>
    </>
  );
}
