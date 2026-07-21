import { Suspense } from "react";

import { PlaylistBrowser } from "@/components/playlist/playlist-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata = {
  title: "Playlist",
  description: "Playlist kurasi Bursa — jalur belajar yang disusun tim Bursa dari video-video terpilih.",
};

export default function PlaylistPage() {
  return (
    <>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="container-page section-spacious">
          <PlaylistBrowser />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
