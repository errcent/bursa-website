import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/search/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursa.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return entries.map((entry) => ({
    url: `${SITE_URL}${entry.url}`,
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
