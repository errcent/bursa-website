import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { InfoPageHero } from "@/components/info-page-hero";
import { LegalDocumentContent } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { termsOfService } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: termsOfService.description,
};

export default function TermsPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow={termsOfService.eyebrow}
          title={termsOfService.title}
          description={termsOfService.description}
        />
        <div className="container-page section-spacious">
          <Link href="/" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <LegalDocumentContent document={termsOfService} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
