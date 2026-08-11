"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";

import { captureAnalyticsEvent } from "@/lib/analytics/posthog";
import { authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import {
  isTurnstileClientConfigured,
  TurnstileWidget,
} from "@/components/turnstile-widget";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistFormProps {
  source?: string;
}

interface WaitlistOutcome {
  duplicate: boolean;
  confirmationEmailScheduled: boolean;
}

export function WaitlistForm({ source = "waitlist-page" }: WaitlistFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<WaitlistOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [armTurnstile, setArmTurnstile] = useState(false);

  const utm = useMemo(
    () => ({
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      utmContent: searchParams.get("utm_content") ?? undefined,
    }),
    [searchParams]
  );

  const turnstileRequired = isTurnstileClientConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (!consent) {
      setError("Setujui kebijakan privasi untuk melanjutkan.");
      return;
    }
    if (turnstileRequired && !turnstileToken) {
      setArmTurnstile(true);
      setError("Selesaikan verifikasi keamanan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          consentGiven: true,
          source,
          ...utm,
          referralCode: searchParams.get("ref") ?? undefined,
          turnstileToken: turnstileToken ?? undefined,
          website: honeypot,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        duplicate?: boolean;
        confirmationEmailScheduled?: boolean;
      };

      if (!response.ok) {
        setError(payload.error ?? "Gagal mendaftar. Coba lagi sebentar.");
        return;
      }

      captureAnalyticsEvent("waitlist_signup", {
        source,
        utm_source: utm.utmSource ?? null,
        utm_medium: utm.utmMedium ?? null,
        utm_campaign: utm.utmCampaign ?? null,
        duplicate: payload.duplicate ?? false,
      });

      setOutcome({
        duplicate: Boolean(payload.duplicate),
        confirmationEmailScheduled: Boolean(payload.confirmationEmailScheduled),
      });
    } catch {
      setError("Koneksi bermasalah. Periksa internet kamu lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (outcome) {
    const submittedEmail = email.trim();

    return (
      <div className="surface-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center sm:p-8">
        <CheckCircle2 className="size-10 text-emerald" strokeWidth={1.5} />
        <h2 className="font-heading text-lg font-semibold">
          {outcome.duplicate ? "Kamu sudah di waitlist" : "Berhasil gabung waitlist"}
        </h2>
        <p className="section-copy max-w-sm">
          {outcome.duplicate ? (
            <>
              <span className="font-medium text-foreground">{submittedEmail}</span> sudah terdaftar.
              Kami akan mengabari kamu begitu Bursa dibuka.
            </>
          ) : (
            <>
              Terima kasih, <span className="font-medium text-foreground">{submittedEmail}</span>{" "}
              sudah masuk waitlist. Kami akan mengabari kamu begitu platform edukasi trading Bursa
              siap dibuka.
            </>
          )}
        </p>
        {outcome.confirmationEmailScheduled ? (
          <p className="text-xs text-muted-foreground">
            Email konfirmasi sedang dikirim. Jika belum terlihat, periksa folder spam atau promosi.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="waitlist-email" className="sr-only">
            Alamat email
          </label>
          <input
            id="waitlist-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setArmTurnstile(true)}
            placeholder="nama@email.com"
            className={authInputClassName}
            aria-invalid={Boolean(error)}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          variant="inverse"
          className="h-12 shrink-0 rounded-xl px-6"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUpRight className="size-4" />
          )}
          Gabung Waitlist
        </Button>
      </div>

      <label className="flex items-start gap-2 text-left text-xs text-muted-foreground sm:text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (error) setError(null);
          }}
          className="mt-0.5 size-4 shrink-0 rounded border-border accent-accent"
          disabled={loading}
        />
        <span>
          Saya setuju menerima konfirmasi, seri onboarding edukasi singkat, serta update produk
          dan peluncuran Bursa. Setelah onboarding, frekuensi maksimal satu email bernilai per
          minggu. Saya dapat mengubah preferensi atau berhenti kapan saja, dan telah membaca{" "}
          <Link href="/privasi" className="link-muted font-medium text-foreground">
            Kebijakan Privasi
          </Link>
          .
        </span>
      </label>

      {/* Honeypot: not focusable, not in a11y tree */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" inert>
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          readOnly={false}
        />
      </div>

      {turnstileRequired && armTurnstile ? (
        <TurnstileWidget onToken={setTurnstileToken} className="flex justify-center sm:justify-start" />
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
