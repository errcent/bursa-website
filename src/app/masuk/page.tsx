import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Masuk — undangan early access",
  description:
    "Akses akun hanya untuk pengguna undangan. Demo publik tersedia tanpa login.",
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
      title="Akses akun — undangan saja"
      description="Saat ini hanya untuk pengguna undangan. Jelajahi demo publik tanpa akun, atau gabung waitlist."
      showMobileBack
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
