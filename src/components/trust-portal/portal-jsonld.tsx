import type { PortalSlug } from "@/lib/public-documents/types";
import type { LegalLocale } from "@/lib/hosts/hosts";
import { LEGAL_ENTITY } from "@/lib/legal/entity";
import { buildOrganizationJsonLd } from "@/lib/search/seo";

import { JsonLdScript } from "@/components/json-ld-script";

export function PortalJsonLd({
  portalSlug,
  title,
  description,
  url,
  locale = "id",
}: {
  portalSlug: PortalSlug;
  title: string;
  description: string;
  url: string;
  locale?: LegalLocale;
}) {
  const about =
    portalSlug === "privasi"
      ? "Privacy Policy"
      : portalSlug === "kepercayaan"
        ? "Security & Trust"
        : "Terms of Service";

  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description,
        url,
        inLanguage: locale === "en" ? "en" : "id",
        isPartOf: {
          "@type": "WebSite",
          name: LEGAL_ENTITY.brand,
          url: "https://bursanalar.com",
        },
        about: {
          "@type": "Thing",
          name: about,
        },
      },
      {
        ...buildOrganizationJsonLd(),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "privacy",
            email: "privacy@bursanalar.com",
            availableLanguage: ["Indonesian", "English"],
          },
          {
            "@type": "ContactPoint",
            contactType: "security",
            email: "security@bursanalar.com",
            availableLanguage: ["Indonesian", "English"],
          },
        ],
      },
    ],
  };

  return <JsonLdScript id={`jsonld-${portalSlug}`} data={json} />;
}
