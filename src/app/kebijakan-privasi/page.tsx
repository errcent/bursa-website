import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

import { InfoPageHero } from "@/components/info-page-hero";
import { LegalDocumentContent } from "@/components/legal-document";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { privacyPolicy } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: privacyPolicy.description,
};

export default function PrivacyPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow={privacyPolicy.eyebrow}
          title={privacyPolicy.title}
          description={privacyPolicy.description}
        />
        <div className="container-page section-spacious">
          <Link href="/" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
          <LegalDocumentContent document={privacyPolicy} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
