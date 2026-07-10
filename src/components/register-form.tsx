"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton, OAuthSessionSync } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { buildLoginHref, POST_AUTH_HOME } from "@/lib/auth/redirect";
import { isValidIndonesianPhone, normalizeIndonesianPhone } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function RegisterForm() {
  const { register, session, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginHref = buildLoginHref(searchParams.get("next"));
  const next = POST_AUTH_HOME;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(next);
    }
  }, [isLoading, session, router, next]);

  useEffect(() => {
    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
    };
  }, []);

  function scheduleUsernameCheck(value: string) {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    const normalized = value.trim().toLowerCase();
    if (!normalized || !USERNAME_PATTERN.test(normalized)) {
      setUsernameCheck("idle");
      return;
    }
    setUsernameCheck("checking");
    usernameTimer.current = setTimeout(() => {
      void fetch(`/api/auth/check-username?username=${encodeURIComponent(normalized)}`)
        .then(async (res) => {
          const data = (await res.json()) as { available?: boolean };
          if (!res.ok) {
            setUsernameCheck("idle");
            return;
          }
          setUsernameCheck(data.available ? "available" : "taken");
        })
        .catch(() => setUsernameCheck("idle"));
    }, 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: typeof fieldErrors = {};
    if (!name.trim()) errors.name = "Nama tampilan wajib diisi.";
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      errors.username = "Username wajib diisi.";
    } else if (!USERNAME_PATTERN.test(normalizedUsername)) {
      errors.username =
        "Username 3–30 karakter, huruf kecil, angka, dan underscore.";
    } else if (usernameCheck === "taken") {
      errors.username = "Username sudah dipakai. Pilih username lain.";
    }
    if (!email.trim()) errors.email = "Email wajib diisi.";
    if (phone.trim()) {
      const normalizedPhone = normalizeIndonesianPhone(phone.trim());
      if (!isValidIndonesianPhone(normalizedPhone)) {
        errors.phone = "Format nomor telepon tidak valid (gunakan +62 atau 08...).";
      }
    }
    if (!password) errors.password = "Kata sandi wajib diisi.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = register({
      name,
      email,
      username: normalizedUsername,
      phone: phone.trim() || undefined,
      password,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    router.replace(next);
  }

  const usernameHint =
    usernameCheck === "checking"
      ? "Memeriksa ketersediaan username..."
      : usernameCheck === "available"
        ? "Username tersedia."
        : usernameCheck === "taken"
          ? "Username sudah dipakai."
          : "Dipakai untuk masuk. Huruf kecil, angka, underscore (3–30 karakter).";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <OAuthSessionSync />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <AuthField
        label="Nama tampilan"
        id="name"
        error={fieldErrors.name}
        helperText="Nama ini tampil di profil, chat, dan sertifikat."
      >
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Contoh: Dinda Ramadhani"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.name)}
        />
      </AuthField>

      <AuthField
        label="Username"
        id="username"
        error={fieldErrors.username}
        helperText={usernameHint}
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => {
              const nextValue = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
              setUsername(nextValue);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
              scheduleUsernameCheck(nextValue);
            }}
            placeholder="dinda_ramadhani"
            className={cn(authInputClassName, "pl-7 pr-9")}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldErrors.username)}
          />
          {usernameCheck === "checking" && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {usernameCheck === "available" && (
            <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
          )}
          {usernameCheck === "taken" && (
            <X className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
          )}
        </div>
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
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="nama@email.com"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.email)}
        />
      </AuthField>

      <AuthField
        label="Nomor telepon (opsional)"
        id="phone"
        error={fieldErrors.phone}
        helperText="Format Indonesia: +62 atau 08... — bisa dipakai untuk masuk."
      >
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          placeholder="+62812xxxxxxx"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.phone)}
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
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="Minimal 8 karakter"
          className={authInputClassName}
          disabled={isSubmitting}
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </AuthField>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Dengan mendaftar, kamu menyetujui bahwa materi di platform ini bersifat edukasi — bukan
        rekomendasi investasi. Lihat{" "}
        <Link href="/kebijakan-privasi" className="font-medium underline-offset-4 hover:underline">
          Kebijakan Privasi
        </Link>
        .
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

      <div className="relative flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">atau</span>
        <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
      </div>

      <GoogleSignInButton mode="register" />

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href={loginHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
        {" · "}
        <Link href="/lupa-password" className="link-accent text-sm font-medium">
          Lupa kata sandi?
        </Link>
      </p>
    </form>
  );
}
