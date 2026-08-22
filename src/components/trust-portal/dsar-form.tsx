"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import type { LegalLocale } from "@/lib/hosts/hosts";

const REQUEST_TYPES = [
  "ACCESS",
  "CORRECTION",
  "DELETION",
  "WITHDRAW_CONSENT",
  "OBJECTION",
  "PORTABILITY",
] as const;

const COPY = {
  id: {
    fullNameMin: "Nama lengkap minimal 2 karakter",
    emailInvalid: "Alamat email tidak valid",
    detailsMin: "Uraian permintaan minimal 10 karakter",
    invalid: "Data tidak valid",
    sendFail: "Permintaan gagal dikirim.",
    sendFailRetry: "Permintaan gagal dikirim. Coba lagi atau kirim email ke privacy@bursanalar.com",
    successTitle: "Permintaan terkirim",
    successBody: "Kami akan merespons paling lambat 14 hari kerja ke alamat email yang tercantum.",
    another: "Kirim permintaan lain",
    heading: "Formulir permintaan data",
    name: "Nama lengkap",
    email: "Email terdaftar",
    type: "Jenis permintaan",
    details: "Uraian permintaan",
    detailsPh: "Jelaskan permintaan secara spesifik.",
    submit: "Kirim permintaan",
    sending: "Mengirim…",
    alt: "Alternatif: email",
    types: {
      ACCESS: "Akses — salinan data pribadi",
      CORRECTION: "Koreksi — perbaiki data tidak akurat",
      DELETION: "Penghapusan — hapus akun dan data",
      WITHDRAW_CONSENT: "Penarikan persetujuan pemrosesan non-esensial",
      OBJECTION: "Keberatan atas pemrosesan tertentu",
      PORTABILITY: "Portabilitas — ekspor data dalam format terbaca mesin",
    },
  },
  en: {
    fullNameMin: "Full name must be at least 2 characters",
    emailInvalid: "Enter a valid email address",
    detailsMin: "Please describe the request in at least 10 characters",
    invalid: "The form contains invalid data",
    sendFail: "The request could not be sent.",
    sendFailRetry: "The request could not be sent. Try again or email privacy@bursanalar.com",
    successTitle: "Request received",
    successBody: "We will respond within 14 business days to the email address provided.",
    another: "Submit another request",
    heading: "Data subject request",
    name: "Full name",
    email: "Registered email",
    type: "Request type",
    details: "Description",
    detailsPh: "Describe the request specifically.",
    submit: "Submit request",
    sending: "Sending…",
    alt: "Alternatively, email",
    types: {
      ACCESS: "Access — a copy of personal data",
      CORRECTION: "Correction — rectify inaccurate data",
      DELETION: "Erasure — delete account and data",
      WITHDRAW_CONSENT: "Withdraw consent for non-essential processing",
      OBJECTION: "Object to specific processing",
      PORTABILITY: "Portability — export machine-readable data",
    },
  },
} as const;

export function DsarRequestForm({ locale = "id" }: { locale?: LegalLocale }) {
  const t = COPY[locale];
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t.fullNameMin),
        email: z.string().email(t.emailInvalid),
        requestType: z.enum(REQUEST_TYPES),
        details: z.string().min(10, t.detailsMin),
      }),
    [t]
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<string>("ACCESS");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({ fullName, email, requestType, details });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.invalid);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/privacy/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? t.sendFail);
        return;
      }
      setSuccess(true);
      setFullName("");
      setEmail("");
      setDetails("");
    } catch {
      setError(t.sendFailRetry);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <p className="font-medium text-emerald-100">{t.successTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.successBody}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
          {t.another}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card/50 p-6">
      <h2 className="font-heading text-lg font-semibold">{t.heading}</h2>

      <div className="space-y-2">
        <label htmlFor="dsar-name" className="text-sm font-medium">
          {t.name}
        </label>
        <input
          id="dsar-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dsar-email" className="text-sm font-medium">
          {t.email}
        </label>
        <input
          id="dsar-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dsar-type" className="text-sm font-medium">
          {t.type}
        </label>
        <select
          id="dsar-type"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
        >
          {REQUEST_TYPES.map((value) => (
            <option key={value} value={value}>
              {t.types[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="dsar-details" className="text-sm font-medium">
          {t.details}
        </label>
        <textarea
          id="dsar-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          placeholder={t.detailsPh}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? t.sending : t.submit}
      </Button>

      <p className="text-xs text-muted-foreground">
        {t.alt}{" "}
        <a href="mailto:privacy@bursanalar.com" className="link-muted">
          privacy@bursanalar.com
        </a>
      </p>
    </form>
  );
}
