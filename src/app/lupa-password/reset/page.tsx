import { Suspense } from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = {
  title: "Reset Kata Sandi",
  description: "Buat kata sandi baru untuk akun Bursa.",
};

function FormFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-muted-foreground">Memuat form...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      title="Buat kata sandi baru"
      description="Pilih kata sandi yang kuat — kami simpan dalam bentuk terenkripsi (bcrypt)."
    >
      <Suspense fallback={<FormFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
