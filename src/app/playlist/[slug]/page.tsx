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
      <div className="hidden md:block">
        <SiteNavbar />
      </div>
      <main className="flex-1 overflow-x-hidden bg-background">
        <PlaylistDetailView slug={slug} />
      </main>
      <SiteFooter />
    </>
  );
}
