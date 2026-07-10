import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { SettingsPageContent } from "@/components/settings-page-content";

export const metadata = {
  title: "Pengaturan",
  description: "Preferensi tampilan dan pengaturan akun Bursa.",
};

export default function SettingsPage() {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <SettingsPageContent />
      </main>
      <SiteFooter />
    </>
  );
}
