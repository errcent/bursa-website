import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Kata Sandi Diperbarui",
  description: "Kata sandi akun Bursa berhasil diperbarui.",
};

export default function ResetSuccessPage() {
  return (
    <AuthPageShell
      title="Kata sandi berhasil diperbarui"
      description="Akun kamu aman. Masuk dengan kata sandi baru untuk melanjutkan belajar."
    >
      <div className="flex flex-col gap-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="size-6 text-emerald-500" aria-hidden />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Kata sandi baru sudah aktif. Demi keamanan, sesi lama di perangkat lain mungkin perlu
          masuk ulang.
        </p>

        <Button asChild className="h-11 w-full btn-primary">
          <Link href="/masuk">Masuk ke akun</Link>
        </Button>

        <Link href="/" className="link-muted">
          Kembali ke beranda
        </Link>
      </div>
    </AuthPageShell>
  );
}
