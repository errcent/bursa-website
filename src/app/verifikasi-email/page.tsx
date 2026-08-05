"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Button } from "@/components/ui/button";

function ResendVerificationButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleResend() {
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "Gagal mengirim ulang tautan.");
        return;
      }
      setStatus("sent");
      setMessage(payload.message ?? "Tautan verifikasi baru telah dikirim.");
    } catch {
      setStatus("error");
      setMessage("Koneksi bermasalah. Coba lagi.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-10"
        disabled={status === "loading" || status === "sent"}
        onClick={() => void handleResend()}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mengirim...
          </>
        ) : status === "sent" ? (
          "Tautan terkirim"
        ) : (
          "Kirim ulang tautan verifikasi"
        )}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

type VerifyState = "loading" | "success" | "already" | "error";

function EmailVerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("Tautan verifikasi tidak lengkap.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = (await response.json()) as {
          email?: string;
          alreadyVerified?: boolean;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          setState("error");
          setErrorMessage(payload.error ?? "Verifikasi gagal.");
          return;
        }

        setEmail(payload.email ?? null);
        setState(payload.alreadyVerified ? "already" : "success");
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Koneksi bermasalah. Coba buka tautan lagi.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memverifikasi email akun...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <ResendVerificationButton />
        <Button className="h-11 btn-primary" render={<Link href="/masuk" />}>
          Kembali ke masuk
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 className="size-10 text-emerald" />
      <div className="space-y-2">
        <p className="font-medium text-foreground">
          {state === "already" ? "Email sudah terverifikasi" : "Email berhasil diverifikasi!"}
        </p>
        {email ? (
          <p className="text-sm text-muted-foreground">
            Akun <span className="font-medium text-foreground">{email}</span> siap dipakai.
          </p>
        ) : null}
      </div>
      <Button className="h-11 btn-primary" render={<Link href="/katalog" />}>
        Mulai belajar
      </Button>
    </div>
  );
}

export default function VerifikasiEmailPage() {
  return (
    <AuthPageShell
      title="Verifikasi email"
      description="Konfirmasi alamat email untuk menyelesaikan pendaftaran akun Bursa."
    >
      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <EmailVerifyContent />
      </Suspense>
    </AuthPageShell>
  );
}
