import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { SettingsAccount } from "@/components/settings-account";
import { SettingsHero } from "@/components/settings-hero";
import { SettingsProfile } from "@/components/settings-profile";
import { ThemeSelector } from "@/components/theme-selector";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Pengaturan",
  description: "Preferensi tampilan dan pengaturan akun Bursa.",
};

export default function SettingsPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <SettingsHero />
        <div className="container-page section-spacious">
          <Link href="/" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>

          <div className="max-w-2xl">
            <SettingsProfile />

            <Separator className="my-10 opacity-60" />

            <section>
              <h2 className="section-title">Tampilan</h2>
              <p className="section-copy mt-1">
                Pilih mode gelap atau terang. Default platform adalah mode gelap cinematic.
              </p>
              <ThemeSelector className="mt-6" />
            </section>

            <Separator className="my-10 opacity-60" />

            <SettingsAccount />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
