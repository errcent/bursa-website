"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { Button } from "@/components/ui/button";
import { mentorInstruments } from "@/lib/mentor-program/content";
import { getPriceGuidance } from "@/lib/mentor/price-guidance";
import type { Instrument } from "@/lib/types";
import { cn } from "@/lib/utils";

const formatIdr = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Non-binding price guidance surfaced in the form (QC-20260719-48/44). Spans Pemula→Mahir per
 * selected instrument so a new mentor sees a reference band. Pricing stays mentor-set — there is
 * NO floor and NO enforcement (LOCKED).
 */
function priceGuidanceFor(instrument: Instrument) {
  const low = getPriceGuidance(instrument, "Pemula");
  const mid = getPriceGuidance(instrument, "Menengah");
  const high = getPriceGuidance(instrument, "Mahir");
  return { min: low.min, typical: mid.typical, max: high.max, note: mid.note };
}

const textareaClassName =
  "w-full resize-y rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/40 focus:shadow-[0_0_20px_var(--glow)] disabled:opacity-50 min-h-[100px]";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  professionalTitle: string;
  instruments: Instrument[];
  yearsExperience: string;
  licenseLabel: string;
  bio: string;
  philosophy: string;
  portfolioUrl: string;
  hasExistingContent: boolean;
  estimatedCoursePrice: string;
  agreedToTerms: boolean;
}

interface UploadedDocument {
  url: string;
  fileName: string;
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  professionalTitle: "",
  instruments: [],
  yearsExperience: "",
  licenseLabel: "",
  bio: "",
  philosophy: "",
  portfolioUrl: "",
  hasExistingContent: false,
  estimatedCoursePrice: "",
  agreedToTerms: false,
};

export function MentorApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [cvDocument, setCvDocument] = useState<UploadedDocument | null>(null);
  const [certificateDocument, setCertificateDocument] = useState<UploadedDocument | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "cvDocument" | "certificateDocument", string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);

  async function uploadDocument(
    file: File,
    kind: "cv" | "certificate"
  ): Promise<UploadedDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const res = await fetch("/api/mentor/applications/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { url?: string; fileName?: string; error?: string };
    if (!res.ok || !data.url || !data.fileName) {
      throw new Error(data.error ?? "Gagal mengunggah dokumen.");
    }
    return { url: data.url, fileName: data.fileName };
  }

  async function handleDocumentChange(
    kind: "cv" | "certificate",
    file: File | null
  ) {
    const field = kind === "cv" ? "cvDocument" : "certificateDocument";
    if (!file) {
      if (kind === "cv") setCvDocument(null);
      else setCertificateDocument(null);
      return;
    }

    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Format tidak didukung. Gunakan PDF, JPG, PNG, atau WebP.",
      }));
      return;
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setErrors((prev) => ({ ...prev, [field]: "Ukuran file maksimal 5 MB." }));
      return;
    }

    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (kind === "cv") setUploadingCv(true);
    else setUploadingCertificate(true);

    try {
      const uploaded = await uploadDocument(file, kind);
      if (kind === "cv") setCvDocument(uploaded);
      else setCertificateDocument(uploaded);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [field]: error instanceof Error ? error.message : "Gagal mengunggah dokumen.",
      }));
    } finally {
      if (kind === "cv") setUploadingCv(false);
      else setUploadingCertificate(false);
    }
  }

  function toggleInstrument(instrument: Instrument) {
    setForm((prev) => {
      const exists = prev.instruments.includes(instrument);
      return {
        ...prev,
        instruments: exists
          ? prev.instruments.filter((i) => i !== instrument)
          : [...prev.instruments, instrument],
      };
    });
    if (errors.instruments) {
      setErrors((prev) => ({ ...prev, instruments: undefined }));
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState | "cvDocument" | "certificateDocument", string>> = {};

    if (!form.fullName.trim()) next.fullName = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Format email tidak valid.";
    if (!form.phone.trim()) next.phone = "Nomor telepon/WhatsApp wajib diisi.";
    if (!form.professionalTitle.trim()) next.professionalTitle = "Judul profesional wajib diisi.";
    if (form.instruments.length === 0) next.instruments = "Pilih minimal satu instrumen.";
    if (!form.yearsExperience || Number(form.yearsExperience) < 1) {
      next.yearsExperience = "Pengalaman minimal 1 tahun.";
    }
    if (!form.bio.trim() || form.bio.trim().length < 50) {
      next.bio = "Bio minimal 50 karakter — jelaskan pengalaman mengajar dan tradingmu.";
    }
    if (!form.philosophy.trim() || form.philosophy.trim().length < 30) {
      next.philosophy = "Filosofi trading minimal 30 karakter.";
    }
    if (!cvDocument) next.cvDocument = "CV wajib diunggah.";
    if (uploadingCv || uploadingCertificate) {
      next.cvDocument = "Tunggu hingga unggahan dokumen selesai.";
    }
    if (!form.agreedToTerms) next.agreedToTerms = "Kamu harus menyetujui syarat & ketentuan.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/mentor/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          professionalTitle: form.professionalTitle.trim(),
          instruments: form.instruments,
          yearsExperience: Number(form.yearsExperience),
          licenseLabel: form.licenseLabel.trim() || undefined,
          bio: form.bio.trim(),
          philosophy: form.philosophy.trim(),
          portfolioUrl: form.portfolioUrl.trim() || undefined,
          hasExistingContent: form.hasExistingContent,
          estimatedCoursePrice: form.estimatedCoursePrice
            ? Number(form.estimatedCoursePrice)
            : undefined,
          agreedToTerms: form.agreedToTerms,
          cvDocumentUrl: cvDocument?.url,
          cvDocumentName: cvDocument?.fileName,
          certificateDocumentUrl: certificateDocument?.url,
          certificateDocumentName: certificateDocument?.fileName,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok) {
        setSubmitError(data.error ?? "Gagal mengirim aplikasi. Coba lagi.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/jadi-mentor/sukses?id=${data.id}`);
    } catch {
      setSubmitError("Koneksi gagal. Periksa jaringan dan coba lagi.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {submitError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField label="Nama lengkap" id="fullName" error={errors.fullName}>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            placeholder="Contoh: Andra Wicaksono"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>

        <AuthField label="Email" id="email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="nama@email.com"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Nomor telepon / WhatsApp"
          id="phone"
          error={errors.phone}
          helperText="Untuk koordinasi wawancara verifikasi."
        >
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="08xx xxxx xxxx"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>

        <AuthField
          label="Judul profesional"
          id="professionalTitle"
          error={errors.professionalTitle}
          helperText="Contoh: Swing Trader & Instruktur Teknikal"
        >
          <input
            id="professionalTitle"
            type="text"
            value={form.professionalTitle}
            onChange={(e) => setForm((p) => ({ ...p, professionalTitle: e.target.value }))}
            placeholder="Spesialisasi dan gelar"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>
      </div>

      <AuthField
        label="Instrumen yang diajarkan"
        id="instruments"
        error={errors.instruments}
        helperText="Pilih satu atau lebih."
      >
        <div className="flex flex-wrap gap-2">
          {mentorInstruments.map((instrument) => {
            const selected = form.instruments.includes(instrument);
            return (
              <button
                key={instrument}
                type="button"
                onClick={() => toggleInstrument(instrument)}
                disabled={isSubmitting}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-accent/40 bg-accent/15 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:border-accent/25"
                )}
              >
                {instrument}
              </button>
            );
          })}
        </div>
      </AuthField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Tahun pengalaman trading"
          id="yearsExperience"
          error={errors.yearsExperience}
        >
          <input
            id="yearsExperience"
            type="number"
            min={1}
            max={50}
            value={form.yearsExperience}
            onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))}
            placeholder="Contoh: 5"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>

        <AuthField
          label="Sertifikasi / lisensi (opsional)"
          id="licenseLabel"
          helperText="CFA, CFP, WPPE, atau lainnya."
        >
          <input
            id="licenseLabel"
            type="text"
            value={form.licenseLabel}
            onChange={(e) => setForm((p) => ({ ...p, licenseLabel: e.target.value }))}
            placeholder="Contoh: CFA Level II"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>
      </div>

      <AuthField
        label="Bio & pengalaman mengajar"
        id="bio"
        error={errors.bio}
        helperText="Minimal 50 karakter. Ceritakan latar belakang trading dan pengalaman mengajar."
      >
        <textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Saya telah trading saham Indonesia sejak 2018 dan mengajar komunitas swing trading sejak 2020..."
          className={textareaClassName}
          disabled={isSubmitting}
          rows={4}
        />
      </AuthField>

      <AuthField
        label="Filosofi trading"
        id="philosophy"
        error={errors.philosophy}
        helperText="Pendekatan dan prinsip yang kamu ajarkan ke murid."
      >
        <textarea
          id="philosophy"
          value={form.philosophy}
          onChange={(e) => setForm((p) => ({ ...p, philosophy: e.target.value }))}
          placeholder="Risk management di atas segalanya. Entry hanya setelah konfirmasi multi-timeframe..."
          className={textareaClassName}
          disabled={isSubmitting}
          rows={3}
        />
      </AuthField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Link portofolio (opsional)"
          id="portfolioUrl"
          helperText="YouTube, LinkedIn, website, atau channel edukasi."
        >
          <input
            id="portfolioUrl"
            type="url"
            value={form.portfolioUrl}
            onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
            placeholder="https://..."
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>

        <AuthField
          label="Estimasi harga kelas (opsional)"
          id="estimatedCoursePrice"
          helperText="Dalam Rupiah, untuk perencanaan kurikulum."
        >
          <input
            id="estimatedCoursePrice"
            type="number"
            min={0}
            step={50000}
            value={form.estimatedCoursePrice}
            onChange={(e) => setForm((p) => ({ ...p, estimatedCoursePrice: e.target.value }))}
            placeholder="Contoh: 499000"
            className={authInputClassName}
            disabled={isSubmitting}
          />
        </AuthField>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
        <p className="font-medium text-foreground">Panduan harga (referensi, tidak mengikat)</p>
        {form.instruments.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih instrumen di atas untuk melihat rentang harga referensi per level.
          </p>
        ) : (
          <>
            <ul className="mt-2 flex flex-col gap-1.5">
              {form.instruments.map((instrument) => {
                const guide = priceGuidanceFor(instrument);
                return (
                  <li
                    key={instrument}
                    className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5"
                  >
                    <span className="text-muted-foreground">{instrument}</span>
                    <span className="text-foreground">
                      {formatIdr(guide.min)} – {formatIdr(guide.max)}
                      <span className="text-muted-foreground">
                        {" "}
                        · umum {formatIdr(guide.typical)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">{priceGuidanceFor(form.instruments[0]!).note}</p>
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          label="Unggah CV"
          id="cvDocument"
          error={errors.cvDocument}
          helperText="PDF atau gambar (JPG/PNG/WebP), maks 5 MB."
        >
          <input
            id="cvDocument"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => void handleDocumentChange("cv", e.target.files?.[0] ?? null)}
            className={authInputClassName}
            disabled={isSubmitting || uploadingCv}
          />
          {cvDocument ? (
            <p className="mt-1 text-xs text-muted-foreground">Terunggah: {cvDocument.fileName}</p>
          ) : null}
        </AuthField>

        <AuthField
          label="Unggah sertifikat (opsional)"
          id="certificateDocument"
          error={errors.certificateDocument}
          helperText="Sertifikasi trading, lisensi, atau credensial relevan."
        >
          <input
            id="certificateDocument"
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) =>
              void handleDocumentChange("certificate", e.target.files?.[0] ?? null)
            }
            className={authInputClassName}
            disabled={isSubmitting || uploadingCertificate}
          />
          {certificateDocument ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Terunggah: {certificateDocument.fileName}
            </p>
          ) : null}
        </AuthField>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/30 p-4">
        <input
          type="checkbox"
          checked={form.hasExistingContent}
          onChange={(e) => setForm((p) => ({ ...p, hasExistingContent: e.target.checked }))}
          disabled={isSubmitting}
          className="mt-1 size-4 rounded border-border accent-accent"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          Saya sudah memiliki konten edukasi sebelumnya (video, webinar, artikel, atau kelas di
          platform lain).
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={form.agreedToTerms}
          onChange={(e) => {
            setForm((p) => ({ ...p, agreedToTerms: e.target.checked }));
            if (errors.agreedToTerms) setErrors((p) => ({ ...p, agreedToTerms: undefined }));
          }}
          disabled={isSubmitting}
          className="mt-1 size-4 rounded border-border accent-accent"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          Saya menyetujui{" "}
          <Link href="/syarat-dan-ketentuan" className="font-medium text-foreground underline-offset-4 hover:underline">
            Syarat & Ketentuan
          </Link>
          ,{" "}
          <Link href="/privasi/kebijakan" className="font-medium text-foreground underline-offset-4 hover:underline">
            Kebijakan Privasi
          </Link>
          , dan memahami bahwa materi edukasi bukan rekomendasi investasi.
        </span>
      </label>
      {errors.agreedToTerms && (
        <p className="-mt-4 text-xs text-destructive">{errors.agreedToTerms}</p>
      )}

      <Button type="submit" className="h-11 w-full btn-primary sm:w-auto sm:px-10" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Mengirim aplikasi...
          </>
        ) : (
          "Kirim Aplikasi Mentor"
        )}
      </Button>
    </form>
  );
}
