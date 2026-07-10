"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { consumePrototypeResetUrl } from "@/components/forgot-password-form";
import { Button } from "@/components/ui/button";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const maskedEmail = searchParams.get("email") ?? "email kamu";
  const [prototypeUrl, setPrototypeUrl] = useState<string | null>(null);

  useEffect(() => {
    setPrototypeUrl(consumePrototypeResetUrl());
  }, []);

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

      {prototypeUrl && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-4 text-left text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Mode prototype — tanpa email nyata</p>
          <p className="mt-1">
            Di produksi, tautan reset dikirim via email. Untuk pengujian, gunakan tautan di
            bawah:
          </p>
          <Link
            href={prototypeUrl}
            className="link-accent mt-2 inline-block break-all text-sm font-medium"
          >
            Buka halaman reset kata sandi
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="h-11">
          <Link href="/lupa-password">Kirim ulang tautan</Link>
        </Button>
        <Button asChild className="h-11 btn-primary">
          <Link href="/masuk">Kembali ke masuk</Link>
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
