import Script from "next/script";

import {
  buildOrganizationJsonLd,
  buildWebsiteSearchJsonLd,
} from "@/lib/search/seo";

export function SearchSeoJsonLd() {
  const website = buildWebsiteSearchJsonLd();
  const organization = buildOrganizationJsonLd();

  return (
    <>
      <Script
        id="jsonld-website-search"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <Script
        id="jsonld-organization"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
