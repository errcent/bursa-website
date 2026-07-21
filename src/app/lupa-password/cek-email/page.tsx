"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Button } from "@/components/ui/button";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const maskedEmail = searchParams.get("email") ?? "email kamu";

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent-soft/40">
          <MailCheck className="size-6 text-accent" aria-hidden />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Jika <span className="font-medium text-foreground">{maskedEmail}</span> terdaftar di
          Bursa, kami mengirim email berisi tautan reset kata sandi.
        </p>
        <p className="text-xs text-muted-foreground">
          Tautan berlaku 30 menit. Periksa folder spam jika email belum masuk dalam beberapa
          menit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" className="h-11" render={<Link href="/lupa-password" />}>
          Kirim ulang tautan
        </Button>
        <Button className="h-11 btn-primary" render={<Link href="/masuk" />}>
          Kembali ke masuk
        </Button>
      </div>
    </div>
  );
}

function CheckEmailFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <p className="text-sm text-muted-foreground">Memuat...</p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <AuthPageShell
      title="Periksa email kamu"
      description="Langkah berikutnya ada di kotak masuk — buka tautan reset untuk melanjutkan."
    >
      <Suspense fallback={<CheckEmailFallback />}>
        <CheckEmailContent />
      </Suspense>
    </AuthPageShell>
  );
}
