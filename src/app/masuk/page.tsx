import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Masuk — akun early access",
  description:
    "Masuk untuk akun Bursa yang sudah ada. Pendaftaran akun baru via waitlist.",
  robots: { index: false, follow: false },
};

function LoginFormFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat formulir masuk">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-md border border-border bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-md border border-border bg-muted/60" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
      <div className="mx-auto h-4 w-40 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Masuk ke akun early access"
      description="Hanya untuk pengguna yang sudah terdaftar sebelumnya. Pendaftaran baru via waitlist."
      showMobileBack
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
