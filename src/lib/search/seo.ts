import type { Metadata } from "next";

import { articles } from "@/lib/articles/content";
import { getCatalogData } from "@/lib/catalog/server";
import { KOMUNITAS_ENABLED } from "@/lib/features/komunitas";
import { searchAll } from "@/lib/search/engine";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursa.id";

export async function buildSearchMetadata(query?: string): Promise<Metadata> {
  const trimmed = query?.trim();

  if (!trimmed) {
    return {
      title: "Katalog Kelas & Mentor Trading",
      description:
        "Jelajahi katalog kelas trading saham, crypto, dan forex dari mentor terverifikasi. Cari berdasarkan instrumen, level, atau nama mentor.",
      keywords: [
        "kelas trading Indonesia",
        "belajar saham",
        "kursus crypto",
        "edukasi forex",
        "mentor trading terverifikasi",
        "fundamental saham",
        "analisis teknikal",
      ],
      alternates: {
        canonical: `${SITE_URL}/katalog`,
      },
      openGraph: {
        title: "Katalog Kelas & Mentor Trading · Bursa",
        description:
          "Temukan kelas dan mentor trading terbaik untuk saham, crypto, dan forex.",
        url: `${SITE_URL}/katalog`,
        type: "website",
        locale: "id_ID",
      },
    };
  }

  const { courses, mentors } = await getCatalogData();
  const results = searchAll(trimmed, { courses, mentors }, 20);
  const courseCount = results.filter((r) => r.type === "course").length;
  const mentorCount = results.filter((r) => r.type === "mentor").length;

  const title = `Hasil "${trimmed}" — ${courseCount} kelas, ${mentorCount} mentor`;
  const description = `Temukan ${courseCount} kelas dan ${mentorCount} mentor terkait "${trimmed}" di Bursa. Edukasi trading saham, crypto, dan forex dari instruktur terverifikasi.`;

  return {
    title,
    description,
    keywords: [
      trimmed,
      `belajar ${trimmed}`,
      `kelas ${trimmed}`,
      `mentor ${trimmed}`,
      "edukasi trading Indonesia",
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
      "Platform edukasi trading dengan katalog mentor dan kelas saham, crypto, serta forex.",
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
    name: "Bursa",
    url: SITE_URL,
    description: "Platform edukasi trading Indonesia dengan mentor terverifikasi.",
    sameAs: [],
  };
}

export async function getSitemapEntries() {
  const { courses, mentors } = await getCatalogData();

  const staticPages = [
    { url: "", priority: 1, changeFrequency: "weekly" as const },
    { url: "/katalog", priority: 0.9, changeFrequency: "daily" as const },
    ...(KOMUNITAS_ENABLED
      ? [{ url: "/komunitas", priority: 0.8, changeFrequency: "daily" as const }]
      : []),
    { url: "/jadi-mentor", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/waitlist", priority: 0.85, changeFrequency: "weekly" as const },
    { url: "/artikel", priority: 0.6, changeFrequency: "weekly" as const },
    { url: "/bantuan", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/syarat-dan-ketentuan", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/privasi", priority: 0.4, changeFrequency: "monthly" as const },
    { url: "/privasi/kebijakan", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/privasi/cookie", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/privasi/sub-prosesor", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/privasi/permintaan-data", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/privasi/faq", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/kepercayaan", priority: 0.4, changeFrequency: "monthly" as const },
    { url: "/kepercayaan/keamanan", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/kepercayaan/kontrol", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/kepercayaan/kepatuhan", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/kepercayaan/pelaporan", priority: 0.2, changeFrequency: "monthly" as const },
    { url: "/kebijakan-privasi", priority: 0.2, changeFrequency: "monthly" as const },
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

  const articlePages = articles.map((a) => ({
    url: `/artikel/${a.slug}`,
    priority: 0.5,
    changeFrequency: "monthly" as const,
  }));

  const searchPages = [
    "fundamental saham",
    "swing trading",
    "crypto pemula",
    "forex trading",
    "analisis teknikal",
    "laporan keuangan",
  ].map((q) => ({
    url: `/katalog?q=${encodeURIComponent(q)}`,
    priority: 0.6,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...coursePages, ...mentorPages, ...articlePages, ...searchPages];
}
