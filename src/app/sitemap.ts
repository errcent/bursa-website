import type { MetadataRoute } from "next";

import { getSitemapEntries } from "@/lib/search/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursanalar.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const entries = await getSitemapEntries();
    return entries.map((entry) => ({
      url: entry.url.startsWith("http") ? entry.url : `${SITE_URL}${entry.url}`,
      lastModified: new Date(),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates:
        "languages" in entry && entry.languages
          ? { languages: entry.languages }
          : undefined,
    }));
  } catch {
    // Build without DB: return minimal static sitemap
    return [{ url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 }];
  }
}
