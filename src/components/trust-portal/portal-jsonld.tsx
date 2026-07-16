import type { PortalSlug } from "@/lib/public-documents/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursa-website.vercel.app";

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
            email: "privacy@bursa.id",
            availableLanguage: "Indonesian",
          },
          {
            "@type": "ContactPoint",
            contactType: "security",
            email: "security@bursa.id",
            availableLanguage: "Indonesian",
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
