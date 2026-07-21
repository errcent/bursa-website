import { Suspense } from "react";

import { PlaylistDetailView } from "@/components/playlist/playlist-detail";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { findCuratedPlaylistBySlug } from "@/lib/playlist/server";

type PlaylistDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PlaylistDetailPageProps) {
  const { slug } = await params;
  const playlist = await findCuratedPlaylistBySlug(slug);

  if (!playlist) {
    return {
      title: "Playlist tidak ditemukan",
      description: "Playlist kurasi Bursa.",
    };
  }

  return {
    title: `${playlist.title} · Playlist`,
    description: playlist.description ?? "Playlist kurasi Bursa.",
  };
}

export default async function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { slug } = await params;

  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="container-page section-spacious">
          <PlaylistDetailView slug={slug} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
