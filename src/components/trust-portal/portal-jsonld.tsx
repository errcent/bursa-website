import type { PortalSlug } from "@/lib/public-documents/types";

import { JsonLdScript } from "@/components/json-ld-script";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursanalar.com";

export function PortalJsonLd({
  portalSlug,
  title,
  description,
  path,
}: {
  portalSlug: PortalSlug;
  title: string;
  description: string;
  path: string;
}) {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description,
        url: `${SITE_URL}${path}`,
        isPartOf: {
          "@type": "WebSite",
          name: "Bursa",
          url: SITE_URL,
        },
        about: {
          "@type": "Thing",
          name: portalSlug === "privasi" ? "Privacy Policy" : "Security & Trust",
        },
      },
      {
        "@type": "Organization",
        name: "Bursa",
        url: SITE_URL,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "privacy",
            email: "privacy@bursanalar.com",
            availableLanguage: "Indonesian",
          },
          {
            "@type": "ContactPoint",
            contactType: "security",
            email: "security@bursanalar.com",
            availableLanguage: "Indonesian",
          },
        ],
      },
    ],
  };

  return <JsonLdScript id={`jsonld-${portalSlug}`} data={json} />;
}
