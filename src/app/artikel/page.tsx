import type { Metadata } from "next";

import { ArticleCard } from "@/components/articles/article-card";
import { InfoPageHero } from "@/components/info-page-hero";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { getAllArticles } from "@/lib/articles/content";

export const metadata: Metadata = {
  title: "Artikel",
  description:
    "Artikel edukasi trading — saham, crypto, forex, analisis teknikal, fundamental, dan psikologi trader dari tim Bursa.",
};

export default function ArtikelPage() {
  const articles = getAllArticles();

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow="Edukasi"
          title="Artikel & Insight Trading"
          description="Tulisan ringkas untuk memperdalam pemahaman — dari candlestick dasar hingga risk management. Materi edukasi, bukan rekomendasi investasi."
        />

        <div className="container-page section-spacious">
          <Reveal>
            <p className="text-sm text-muted-foreground">
              {articles.length} artikel tersedia · Diperbarui berkala
            </p>
          </Reveal>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </Stagger>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
