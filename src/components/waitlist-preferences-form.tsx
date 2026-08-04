"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface PreferenceValues {
  wantsProductUpdates: boolean;
  wantsEducation: boolean;
  wantsLaunchNews: boolean;
  experienceLevel: string | null;
  learningGoal: string | null;
  marketInterest: string | null;
}

interface WaitlistPreferencesFormProps {
  entryId: string;
  signature: string;
  maskedEmail: string;
  initial: PreferenceValues;
  initiallyUnsubscribed: boolean;
}

const topics = [
  {
    key: "wantsEducation" as const,
    title: "Materi edukasi",
    description: "Checklist, mini lesson, dan materi belajar yang bisa langsung dipraktikkan.",
  },
  {
    key: "wantsProductUpdates" as const,
    title: "Update produk",
    description: "Perkembangan Bursa, preview pengalaman, dan build update yang substansial.",
  },
  {
    key: "wantsLaunchNews" as const,
    title: "Kabar peluncuran",
    description: "Tanggal akses, demo, FAQ, dan informasi saat Bursa resmi dibuka.",
  },
];

export function WaitlistPreferencesForm({
  entryId,
  signature,
  maskedEmail,
  initial,
  initiallyUnsubscribed,
}: WaitlistPreferencesFormProps) {
  const [values, setValues] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    initiallyUnsubscribed ? "saved" : "idle"
  );
  const [message, setMessage] = useState(
    initiallyUnsubscribed
      ? "Kamu sudah berhenti dari seluruh email lifecycle waitlist."
      : ""
  );

  async function save() {
    setState("saving");
    setMessage("");
    try {
      const query = new URLSearchParams({ id: entryId, sig: signature });
      const response = await fetch(`/api/waitlist/preferences?${query.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string; unsubscribed?: boolean };
      if (!response.ok) throw new Error(result.error || "Gagal menyimpan preferensi.");

      setState("saved");
      setMessage(
        result.unsubscribed
          ? "Semua email lifecycle waitlist sudah dihentikan."
          : "Preferensi email berhasil disimpan."
      );
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan preferensi.");
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Preferensi untuk</p>
        <p className="font-medium">{maskedEmail}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-3 font-heading text-lg font-semibold">Email yang ingin diterima</legend>
        {topics.map((topic) => (
          <label
            key={topic.key}
            className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
          >
            <input
              type="checkbox"
              className="mt-1 size-4 accent-primary"
              checked={values[topic.key]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [topic.key]: event.target.checked }))
              }
            />
            <span>
              <span className="block font-medium">{topic.title}</span>
              <span className="block text-sm text-muted-foreground">{topic.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Level pengalaman</span>
          <select
            value={values.experienceLevel ?? ""}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                experienceLevel: event.target.value || null,
              }))
            }
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          >
            <option value="">Belum dipilih</option>
            <option value="pemula">Pemula</option>
            <option value="menengah">Menengah</option>
            <option value="mahir">Mahir</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Tujuan belajar</span>
          <input
            value={values.learningGoal ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, learningGoal: event.target.value || null }))
            }
            maxLength={120}
            placeholder="Contoh: memahami risiko"
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Topik atau market</span>
          <input
            value={values.marketInterest ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, marketInterest: event.target.value || null }))
            }
            maxLength={120}
            placeholder="Contoh: saham Indonesia"
            className="h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
      </div>

      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Jika seluruh kategori dimatikan, kamu akan berhenti dari semua email marketing waitlist.
        Email keamanan dan transaksi akun tetap terpisah.
      </div>

      <Button onClick={save} disabled={state === "saving"} className="min-h-11 w-full sm:w-auto">
        {state === "saving" ? "Menyimpan..." : "Simpan preferensi"}
      </Button>
      {message ? (
        <p
          role="status"
          className={state === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

