import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { ArticleContent } from "@/components/articles/article-content";
import { InfoPageHero } from "@/components/info-page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { articles, getArticleBySlug } from "@/lib/articles/content";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <InfoPageHero
          eyebrow={article.category}
          title={article.title}
          description={article.excerpt}
        />

        <div className="container-page section-spacious">
          <Link href="/artikel" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Semua artikel
          </Link>
          <ArticleContent article={article} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
