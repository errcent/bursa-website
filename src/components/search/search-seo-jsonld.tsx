import { JsonLdScript } from "@/components/json-ld-script";
import {
  buildOrganizationJsonLd,
  buildWebsiteSearchJsonLd,
} from "@/lib/search/seo";

export function SearchSeoJsonLd() {
  const website = buildWebsiteSearchJsonLd();
  const organization = buildOrganizationJsonLd();

  return (
    <>
      <JsonLdScript id="jsonld-website-search" data={website} />
      <JsonLdScript id="jsonld-organization" data={organization} />
    </>
  );
}
