import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Lupa Kata Sandi",
  description: "Reset kata sandi akun Bursa Trading Academy.",
};

function FormFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-muted-foreground">Memuat form...</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Lupa kata sandi?"
      description="Masukkan email terdaftar. Kami kirim tautan aman untuk membuat kata sandi baru."
    >
      <Suspense fallback={<FormFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
