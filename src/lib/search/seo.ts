import type { Metadata } from "next";

import { getCatalogData } from "@/lib/catalog/server";
import { searchAll } from "@/lib/search/engine";
import { LEGAL_HREFS, privacyPublicUrl, termsPublicUrl, trustPublicUrl } from "@/lib/hosts/hosts";
import { LEGAL_ENTITY } from "@/lib/legal/entity";
import { DEFAULT_OG, SITE_URL } from "@/lib/site-metadata";

export async function buildSearchMetadata(query?: string): Promise<Metadata> {
  const trimmed = query?.trim();

  if (!trimmed) {
    return {
      title: "Katalog Kelas & Mentor Trading & Investasi",
      description:
        "Jelajahi katalog kelas trading dan investasi saham, crypto, dan forex dari mentor yang melalui proses kurasi. Cari berdasarkan instrumen, level, atau nama mentor.",
      keywords: [
        "kelas trading Indonesia",
        "belajar investasi",
        "belajar saham",
        "kursus crypto",
        "edukasi forex",
        "mentor trading kurasi",
        "fundamental saham",
        "analisis teknikal",
      ],
      alternates: {
        canonical: `${SITE_URL}/katalog`,
      },
      openGraph: {
        title: "Katalog Kelas & Mentor Trading & Investasi · Bursa",
        description:
          "Temukan kelas dan mentor trading & investasi untuk saham, crypto, dan forex.",
        url: `${SITE_URL}/katalog`,
        type: "website",
        locale: "id_ID",
        images: [DEFAULT_OG],
      },
    };
  }

  const { courses, mentors } = await getCatalogData();
  const results = searchAll(trimmed, { courses, mentors }, 20);
  const courseCount = results.filter((r) => r.type === "course").length;
  const mentorCount = results.filter((r) => r.type === "mentor").length;

  const title = `Hasil "${trimmed}", ${courseCount} kelas, ${mentorCount} mentor`;
  const description = `Temukan ${courseCount} kelas dan ${mentorCount} mentor terkait "${trimmed}" di Bursa. Edukasi trading dan investasi saham, crypto, dan forex dari instruktur yang dikurasi.`;

  return {
    title,
    description,
    keywords: [
      trimmed,
      `belajar ${trimmed}`,
      `kelas ${trimmed}`,
      `mentor ${trimmed}`,
      "edukasi trading dan investasi Indonesia",
    ],
    alternates: {
      canonical: `${SITE_URL}/katalog?q=${encodeURIComponent(trimmed)}`,
    },
    openGraph: {
      title: `${title} · Bursa`,
      description,
      url: `${SITE_URL}/katalog?q=${encodeURIComponent(trimmed)}`,
      type: "website",
      locale: "id_ID",
      images: [DEFAULT_OG],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildWebsiteSearchJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bursa",
    url: SITE_URL,
    description:
      "Platform edukasi trading dan investasi dengan katalog mentor dan kelas saham, crypto, serta forex.",
    inLanguage: "id-ID",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/katalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export async function buildSearchResultsJsonLd(query: string) {
  const { courses, mentors } = await getCatalogData();
  const results = searchAll(query, { courses, mentors }, 10);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hasil pencarian: ${query}`,
    numberOfItems: results.length,
    itemListElement: results.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: `${SITE_URL}${item.href}`,
      description: item.subtitle,
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: LEGAL_ENTITY.brand,
    legalName: LEGAL_ENTITY.legalName,
    alternateName: [LEGAL_ENTITY.productName],
    url: SITE_URL,
    description: "Platform edukasi trading dan investasi Indonesia dengan proses kurasi mentor.",
    identifier: LEGAL_ENTITY.registrationNumber,
    address: {
      "@type": "PostalAddress",
      streetAddress: LEGAL_ENTITY.streetAddress,
      addressLocality: LEGAL_ENTITY.city,
      addressCountry: LEGAL_ENTITY.country,
    },
    sameAs: [],
  };
}

export async function getSitemapEntries() {
  const { courses, mentors } = await getCatalogData();

  const legalPages = [
    {
      url: LEGAL_HREFS.privacy,
      priority: 0.4,
      changeFrequency: "monthly" as const,
      languages: { id: privacyPublicUrl("hub", "id"), en: privacyPublicUrl("hub", "en") },
    },
    {
      url: LEGAL_HREFS.privacyPolicy,
      priority: 0.4,
      changeFrequency: "monthly" as const,
      languages: { id: privacyPublicUrl("kebijakan", "id"), en: privacyPublicUrl("kebijakan", "en") },
    },
    {
      url: LEGAL_HREFS.cookies,
      priority: 0.2,
      changeFrequency: "monthly" as const,
      languages: { id: privacyPublicUrl("cookie", "id"), en: privacyPublicUrl("cookie", "en") },
    },
    {
      url: LEGAL_HREFS.subprocessors,
      priority: 0.2,
      changeFrequency: "monthly" as const,
      languages: { id: privacyPublicUrl("sub-prosesor", "id"), en: privacyPublicUrl("sub-prosesor", "en") },
    },
    {
      url: LEGAL_HREFS.dsar,
      priority: 0.3,
      changeFrequency: "monthly" as const,
      languages: { id: privacyPublicUrl("permintaan-data", "id"), en: privacyPublicUrl("permintaan-data", "en") },
    },
    {
      url: LEGAL_HREFS.trust,
      priority: 0.4,
      changeFrequency: "monthly" as const,
      languages: { id: trustPublicUrl("hub", "id"), en: trustPublicUrl("hub", "en") },
    },
    {
      url: termsPublicUrl("terms"),
      priority: 0.4,
      changeFrequency: "monthly" as const,
      languages: { id: termsPublicUrl("terms", "id"), en: termsPublicUrl("terms", "en") },
    },
    {
      url: LEGAL_HREFS.guidelines,
      priority: 0.3,
      changeFrequency: "monthly" as const,
      languages: {
        id: termsPublicUrl("learner-guidelines", "id"),
        en: termsPublicUrl("learner-guidelines", "en"),
      },
    },
  ];

  const staticPages = [
    { url: "", priority: 1, changeFrequency: "weekly" as const },
    { url: "/katalog", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/jadi-mentor", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/waitlist", priority: 0.85, changeFrequency: "weekly" as const },
    { url: "/bantuan", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/masuk", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/daftar", priority: 0.4, changeFrequency: "monthly" as const },
  ];

  const coursePages = courses.map((c) => ({
    url: `/kelas/${c.slug}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
  }));

  const mentorPages = mentors.map((m) => ({
    url: `/instruktur/${m.slug}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  const searchPages = [
    "fundamental saham",
    "swing trading",
    "crypto pemula",
    "belajar investasi",
    "forex trading",
    "analisis teknikal",
    "laporan keuangan",
  ].map((q) => ({
    url: `/katalog?q=${encodeURIComponent(q)}`,
    priority: 0.6,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...legalPages, ...coursePages, ...mentorPages, ...searchPages];
}
