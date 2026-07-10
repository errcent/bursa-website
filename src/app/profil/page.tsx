import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AuthGuard } from "@/components/auth-guard";
import { ProfileEditor } from "@/components/profile-editor";
import { ProfileHero } from "@/components/profile-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export const metadata = {
  title: "Profil",
  description: "Kelola foto, nama tampilan, dan bio profil Bursa.",
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="h-14 border-b border-border" />}>
        <SiteNavbar />
      </Suspense>
      <main className="flex-1">
        <ProfileHero />
        <div className="container-page section-spacious">
          <Link href="/dashboard" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>

          <div className="max-w-2xl">
            <ProfileEditor />
          </div>
        </div>
      </main>
      <SiteFooter />
    </AuthGuard>
  );
}
