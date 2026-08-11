import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Daftar",
  description: "Buat akun Bursa.",
};

function RegisterFormFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat formulir daftar">
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-md border border-border bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-11 w-full animate-pulse rounded-md border border-border bg-muted/60" />
      </div>
      <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Buat akun gratis"
      description="Mulai jelajahi katalog kelas trading, saham, crypto, dan forex."
      showMobileBack
    >
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthPageShell>
  );
}
