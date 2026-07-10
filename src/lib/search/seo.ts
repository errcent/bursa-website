import type { Metadata } from "next";

import { courses, mentors } from "@/lib/mock-data";
import { searchAll } from "@/lib/search/engine";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bursa.id";

export function buildSearchMetadata(query?: string): Metadata {
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

  const results = searchAll(trimmed, 20);
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

export function buildSearchResultsJsonLd(query: string) {
  const results = searchAll(query, 10);

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

export function getSitemapEntries() {
  const staticPages = [
    { url: "", priority: 1, changeFrequency: "weekly" as const },
    { url: "/katalog", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/komunitas", priority: 0.8, changeFrequency: "daily" as const },
    { url: "/jadi-mentor", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/syarat-dan-ketentuan", priority: 0.3, changeFrequency: "monthly" as const },
    { url: "/kebijakan-privasi", priority: 0.3, changeFrequency: "monthly" as const },
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
    "forex trading",
    "analisis teknikal",
    "laporan keuangan",
  ].map((q) => ({
    url: `/katalog?q=${encodeURIComponent(q)}`,
    priority: 0.6,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...coursePages, ...mentorPages, ...searchPages];
}
