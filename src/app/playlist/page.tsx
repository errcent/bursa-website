import { Suspense } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { PlaylistBrowser } from "@/components/playlist/playlist-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata = {
  title: "Playlist",
  description: "Kurasi pelajaran dari berbagai mentor menjadi playlist belajar pribadi Anda.",
};

export default function PlaylistPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <div className="container-page section-spacious">
          <PlaylistBrowser />
        </div>
      </main>
      <SiteFooter />
    </AuthGuard>
  );
}
