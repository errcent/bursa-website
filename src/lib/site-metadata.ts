import type { Metadata } from "next";

import { BRAND_ASSETS } from "@/lib/brand/assets";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursanalar.com";

export const DEFAULT_OG = {
  url: BRAND_ASSETS.ogDefault,
  width: 1200,
  height: 630,
  alt: "Bursa: katalog mentor dan kelas trading & investasi",
} as const;

export const DEFAULT_TWITTER_IMAGE = {
  url: BRAND_ASSETS.ogTwitter,
  width: 1200,
  height: 675,
  alt: "Bursa: katalog mentor dan kelas trading & investasi",
} as const;

export const rootSiteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bursa · Katalog Mentor dan Kelas Trading & Investasi",
    template: "%s · Bursa",
  },
  description:
    "Platform edukasi trading dan investasi dengan katalog mentor dan kelas saham, crypto, serta forex. Fokus pada proses belajar, riset, dan manajemen risiko.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Bursa",
    title: "Bursa · Katalog Mentor dan Kelas Trading & Investasi",
    description:
      "Platform edukasi trading dan investasi dengan katalog mentor dan kelas saham, crypto, serta forex.",
    url: SITE_URL,
    images: [DEFAULT_OG],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bursa · Katalog Mentor dan Kelas Trading & Investasi",
    description:
      "Platform edukasi trading dan investasi dengan katalog mentor dan kelas saham, crypto, serta forex.",
    images: [DEFAULT_TWITTER_IMAGE.url],
  },
};

/** Merge page metadata while preserving default OG/Twitter images when omitted. */
export function withOgDefaults(metadata: Metadata): Metadata {
  const ogImages =
    metadata.openGraph?.images ??
    (typeof metadata.openGraph === "object" ? rootSiteMetadata.openGraph?.images : undefined);

  const twitterImages =
    metadata.twitter && typeof metadata.twitter === "object" && "images" in metadata.twitter
      ? metadata.twitter.images
      : undefined;

  return {
    ...metadata,
    openGraph: {
      ...(typeof rootSiteMetadata.openGraph === "object" ? rootSiteMetadata.openGraph : {}),
      ...(typeof metadata.openGraph === "object" ? metadata.openGraph : {}),
      images: ogImages ?? [DEFAULT_OG],
    },
    twitter: {
      ...(typeof rootSiteMetadata.twitter === "object" ? rootSiteMetadata.twitter : {}),
      ...(typeof metadata.twitter === "object" ? metadata.twitter : {}),
      card: "summary_large_image",
      images: twitterImages ?? [DEFAULT_TWITTER_IMAGE.url],
    },
  };
}

export function emailHeaderUrl(variant: "dark" | "light" = "light"): string {
  const path =
    variant === "dark" ? BRAND_ASSETS.emailHeaderDark : BRAND_ASSETS.emailHeaderLight;
  return `${SITE_URL.replace(/\/$/, "")}${path}`;
}
