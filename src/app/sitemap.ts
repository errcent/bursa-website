import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/search/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursa.id";

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries().map((entry) => ({
    url: `${SITE_URL}${entry.url}`,
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
