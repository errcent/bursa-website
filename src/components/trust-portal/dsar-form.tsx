"use client";

import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const schema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  requestType: z.enum([
    "ACCESS",
    "CORRECTION",
    "DELETION",
    "WITHDRAW_CONSENT",
    "OBJECTION",
    "PORTABILITY",
  ]),
  details: z.string().min(10, "Jelaskan permintaanmu minimal 10 karakter"),
});

const REQUEST_LABELS: Record<string, string> = {
  ACCESS: "Akses data — minta salinan data pribadi",
  CORRECTION: "Koreksi — perbaiki data tidak akurat",
  DELETION: "Penghapusan — hapus akun dan data",
  WITHDRAW_CONSENT: "Tarik persetujuan pemrosesan non-esensial",
  OBJECTION: "Keberatan atas pemrosesan tertentu",
  PORTABILITY: "Portabilitas — export data format terbaca",
};

export function DsarRequestForm() {
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
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
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
        setError(data.error ?? "Gagal mengirim permintaan.");
        return;
      }
      setSuccess(true);
      setFullName("");
      setEmail("");
      setDetails("");
    } catch {
      setError("Gagal mengirim permintaan. Coba lagi atau email privacy@bursanalar.com");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <p className="font-medium text-emerald-100">Permintaan terkirim</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Kami akan merespons dalam maksimal 14 hari kerja via email yang kamu berikan.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
          Kirim permintaan lain
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card/50 p-6">
      <h2 className="font-heading text-lg font-semibold">Form Permintaan Data</h2>

      <div className="space-y-2">
        <label htmlFor="dsar-name" className="text-sm font-medium">
          Nama lengkap
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
          Email terdaftar di Bursa
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
          Jenis permintaan
        </label>
        <select
          id="dsar-type"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
        >
          {Object.entries(REQUEST_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="dsar-details" className="text-sm font-medium">
          Detail permintaan
        </label>
        <textarea
          id="dsar-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          placeholder="Jelaskan permintaanmu secara spesifik..."
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Mengirim..." : "Kirim permintaan"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Alternatif: email{" "}
        <a href="mailto:privacy@bursanalar.com" className="link-muted">
          privacy@bursanalar.com
        </a>
      </p>
    </form>
  );
}
