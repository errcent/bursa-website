"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { buildLoginHref, POST_AUTH_HOME } from "@/lib/auth/redirect";

export function RegisterForm() {
  const { register, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginHref = buildLoginHref(searchParams.get("next"));
  // New accounts always land on beranda — ignore sticky ?next= from prior sessions.
  const next = POST_AUTH_HOME;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(next);
    }
  }, [isLoading, session, router, next]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) errors.name = "Nama wajib diisi.";
    if (!email.trim()) errors.email = "Email wajib diisi.";
    if (!password) errors.password = "Kata sandi wajib diisi.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = register({ name, email, password });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    router.replace(next);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <AuthField
        label="Nama lengkap"
        id="name"
        error={fieldErrors.name}
        helperText="Nama ini akan tampil di profil dan sertifikat."
      >
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }
          }}
          placeholder="Contoh: Dinda Ramadhani"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.name)}
        />
      </AuthField>

      <AuthField
        label="Email"
        id="email"
        error={fieldErrors.email}
        helperText="Kami kirim update kelas penting ke email ini."
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          placeholder="nama@email.com"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.email)}
        />
      </AuthField>

      <AuthField
        label="Kata sandi"
        id="password"
        error={fieldErrors.password}
        helperText="Pakai minimal 8 karakter agar akun lebih aman."
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          placeholder="Minimal 8 karakter"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </AuthField>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Dengan mendaftar, kamu menyetujui bahwa materi di platform ini bersifat edukasi — bukan
        rekomendasi investasi.
      </p>

      <Button type="submit" className="h-11 w-full btn-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Menyiapkan akun...
          </>
        ) : (
          "Daftar Sekarang"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href={loginHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
