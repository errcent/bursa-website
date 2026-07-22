import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth-page-shell";
import { GoogleOAuthComplete } from "@/components/auth/google-oauth-complete";

export const metadata: Metadata = {
  title: "Menyelesaikan login",
  robots: { index: false, follow: false },
};

export default function GoogleOAuthDonePage() {
  return (
    <AuthPageShell
      title="Hampir selesai"
      description="Kami sedang menyinkronkan akun Google kamu."
      showMobileBack
      mobileBackHref="/masuk"
    >
      <GoogleOAuthComplete />
    </AuthPageShell>
  );
}
