"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";

const PROTOTYPE_RESET_KEY = "bursa-prototype-reset-url";

export function storePrototypeResetUrl(url: string) {
  try {
    sessionStorage.setItem(PROTOTYPE_RESET_KEY, url);
  } catch {
    // ignore
  }
}

export function consumePrototypeResetUrl(): string | null {
  try {
    const url = sessionStorage.getItem(PROTOTYPE_RESET_KEY);
    if (url) sessionStorage.removeItem(PROTOTYPE_RESET_KEY);
    return url;
  } catch {
    return null;
  }
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(undefined);

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError("Email wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await res.json()) as {
        error?: string;
        maskedEmail?: string;
        prototypeResetUrl?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Permintaan gagal. Coba lagi.");
        return;
      }

      if (data.prototypeResetUrl) {
        storePrototypeResetUrl(data.prototypeResetUrl);
      }

      const masked = data.maskedEmail ?? trimmed;
      router.push(`/lupa-password/cek-email?email=${encodeURIComponent(masked)}`);
    } catch {
      setError("Koneksi bermasalah. Periksa jaringan lalu coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-accent/30 bg-accent-soft/40">
          <Mail className="size-5 text-accent" aria-hidden />
        </div>
      </div>

      <AuthField
        label="Email"
        id="forgot-email"
        error={fieldError}
        helperText="Masukkan email akun Bursa kamu. Kami kirim tautan reset jika email terdaftar."
      >
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(undefined);
          }}
          placeholder="nama@email.com"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldError)}
        />
      </AuthField>

      <Button type="submit" className="h-11 w-full btn-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mengirim tautan...
          </>
        ) : (
          "Kirim Tautan Reset"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ingat kata sandi?{" "}
        <Link href="/masuk" className="link-accent text-sm font-medium">
          Kembali ke masuk
        </Link>
      </p>
    </form>
  );
}
