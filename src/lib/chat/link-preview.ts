import type { MessageEmbed } from "./types";

const URL_PATTERN = /https?:\/\/[^\s<]+/gi;

const MOCK_PREVIEWS: Record<string, Omit<MessageEmbed, "url">> = {
  "idx.co.id": {
    title: "Bursa Efek Indonesia",
    description: "Informasi resmi pasar modal Indonesia, data IHSG, dan pengumuman BEI.",
    siteName: "IDX",
    color: "#1a4d8f",
  },
  "tradingview.com": {
    title: "TradingView — Chart & Analisis",
    description: "Platform charting interaktif untuk saham, crypto, dan forex.",
    siteName: "TradingView",
    color: "#2962ff",
  },
  "investopedia.com": {
    title: "Investopedia — Edukasi Investasi",
    description: "Artikel dan definisi istilah keuangan untuk investor pemula hingga mahir.",
    siteName: "Investopedia",
    color: "#2d6a4f",
  },
};

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

export function generateEmbedFromUrl(url: string): MessageEmbed {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    for (const [domain, preview] of Object.entries(MOCK_PREVIEWS)) {
      if (hostname.includes(domain)) {
        return { url, ...preview };
      }
    }
  } catch {
    /* invalid url */
  }

  return {
    url,
    title: url,
    siteName: "Tautan Eksternal",
  };
}

export function generateEmbedsFromText(text: string): MessageEmbed[] {
  return extractUrls(text).map(generateEmbedFromUrl);
}
