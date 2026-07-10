import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { RegisterForm } from "@/components/register-form";

export const metadata = {
  title: "Daftar",
  description: "Buat akun Bursa Trading Academy.",
};

function RegisterFormFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-muted-foreground">Memuat form...</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Buat akun gratis"
      description="Mulai jelajahi katalog kelas trading — saham, crypto, dan forex."
    >
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthPageShell>
  );
}
