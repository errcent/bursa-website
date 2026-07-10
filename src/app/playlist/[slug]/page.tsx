import { Suspense } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { PlaylistDetailView } from "@/components/playlist/playlist-detail";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

type PlaylistDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PlaylistDetailPageProps) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${title} · Playlist`,
    description: "Playlist belajar kurasi pribadi di Bursa.",
  };
}

export default async function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { slug } = await params;

  return (
    <AuthGuard>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="container-page section-spacious">
          <PlaylistDetailView slug={slug} />
        </div>
      </main>
      <SiteFooter />
    </AuthGuard>
  );
}
