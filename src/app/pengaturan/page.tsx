import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { SettingsAccount } from "@/components/settings-account";
import { SettingsHero } from "@/components/settings-hero";
import { SettingsPayment } from "@/components/settings-payment";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
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
          <Link href="/dashboard" className="link-muted mb-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>

          <div className="max-w-2xl">
            <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Profil publik</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Foto, nama tampilan, dan bio dikelola di halaman profil terpisah.
                </p>
              </div>
              <Button size="sm" variant="outline" render={<Link href="/profil" />}>
                <UserRound className="size-3.5" />
                Edit profil
              </Button>
            </div>

            <Separator className="my-10 opacity-60" />

            <SettingsAccount />

            <Separator className="my-10 opacity-60" />

            <SettingsPayment />

            <Separator className="my-10 opacity-60" />

            <section>
              <h2 className="section-title">Tampilan</h2>
              <p className="section-copy mt-1">
                Pilih mode gelap atau terang. Default platform adalah mode gelap cinematic.
              </p>
              <ThemeSelector className="mt-6" />
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
