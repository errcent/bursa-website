import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Masuk",
  description: "Masuk ke akun Bursa Trading Academy.",
};

function LoginFormFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-muted-foreground">Memuat form...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Selamat datang kembali"
      description="Masuk untuk melanjutkan belajar dan mengakses dashboard."
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
