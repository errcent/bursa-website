"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decideMentorApplication, fetchMentorApplication } from "@/lib/admin/api";
import { hasMeaningfulL1Answers, l1AdminRows } from "@/lib/mentor-program/l1-admin-display";
import type { MentorApplicationRecord } from "@/lib/mentor-program/types";
import { toSafeHttpUrl } from "@/lib/security/safe-http-url";

const ACTIONS: Array<{ action: string; label: string }> = [
  { action: "invite_l2", label: "Undang / buat tautan L2" },
  { action: "info_required", label: "Minta info" },
  { action: "talent_pool", label: "Talent pool" },
  { action: "reject", label: "Tolak" },
  { action: "revision_required", label: "Revisi L2" },
  { action: "mark_review", label: "Tandai review" },
  { action: "mark_assessment", label: "Tandai assessment" },
  { action: "mark_final_review", label: "Final review" },
  { action: "approve", label: "Setujui (belum buat profil)" },
  { action: "onboarding", label: "Onboarding" },
  { action: "production_ready", label: "Production ready" },
];

function AnswerList({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data) return null;
  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="mb-3 font-heading font-semibold">{title}</h2>
      <dl className="grid gap-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="break-words whitespace-pre-wrap">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function L1AnswerList({ data }: { data: Record<string, unknown> }) {
  const rows = l1AdminRows(data);
  if (!hasMeaningfulL1Answers(data) || rows.length === 0) {
    return (
      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-2 font-heading font-semibold">Jawaban L1</h2>
        <p className="text-sm text-muted-foreground">
          Tidak ada jawaban tahap 1. Ini undangan L2 langsung, atau baris lama sebelum pipeline L1.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="mb-3 font-heading font-semibold">Jawaban L1</h2>
      <dl className="grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-1 sm:grid-cols-[13rem_1fr]">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-words whitespace-pre-wrap">
              {row.id.includes("url") || row.id === "l1_extra_links" ? (
                <span className="flex flex-col gap-1">
                  {row.value.split("\n").map((href) => {
                    const safeHref = toSafeHttpUrl(href);
                    return safeHref ? (
                      <a
                        key={href}
                        href={safeHref}
                        className="text-accent underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {href}
                      </a>
                    ) : (
                      <span key={href}>{href}</span>
                    );
                  })}
                </span>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function AdminMentorApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useAdminToast();
  const [item, setItem] = useState<MentorApplicationRecord | null>(null);
  const [note, setNote] = useState("");
  const [l2Url, setL2Url] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchMentorApplication(params.id);
      setItem(result.data);
      setNote(result.data.adminNote ?? "");
    } catch {
      toast("Gagal memuat aplikasi.", "error");
    }
  }, [params.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: string) {
    setSaving(true);
    try {
      const result = await decideMentorApplication(params.id, action, note || undefined);
      setItem(result.data.application);
      if (result.data.l2Url) setL2Url(result.data.l2Url);
      toast("Status diperbarui.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal memperbarui.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!item) return <p className="text-sm text-muted-foreground">Memuat…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/mentor-applications" className="text-xs text-muted-foreground hover:underline">
          ← Antrian
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold">{item.fullName}</h1>
        <p className="text-sm text-muted-foreground">{item.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{item.track}</Badge>
          <Badge>{item.status}</Badge>
        </div>
      </div>

      {item.legacyPayload ? (
        <p className="text-xs text-muted-foreground">
          Baris ini dimigrasi dari formulir lama. Field L1 mungkin tidak lengkap.
        </p>
      ) : null}

      <L1AnswerList data={item.l1Answers} />
      <AnswerList title="Jawaban L2" data={item.l2Answers} />

      <label className="text-sm">
        Catatan internal (ikut email jika tolak / pool / minta info)
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {l2Url ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3 text-xs">
          <p className="break-all">Tautan L2 (hanya tampil sekali setelah generate): {l2Url}</p>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(l2Url);
              toast("Tautan L2 disalin.");
            }}
          >
            Salin tautan L2
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((itemAction) => (
          <Button
            key={itemAction.action}
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => void run(itemAction.action)}
          >
            {itemAction.label}
          </Button>
        ))}
      </div>

      {item.status === "APPROVED" ||
      item.status === "ONBOARDING" ||
      item.status === "PRODUCTION_READY" ? (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <h2 className="font-heading font-semibold">Checklist: salin ke mentor (manual)</h2>
          <p className="mt-1 text-muted-foreground">
            Setujui <strong>tidak</strong> membuat <code>MentorProfile</code>. Profil live dibuat terpisah di Admin
            → Mentor.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>
              Buka{" "}
              <Link href="/admin/mentors" className="underline">
                Admin → Mentor
              </Link>
              .
            </li>
            <li>
              Buat atau tautkan profil dengan email <span className="font-mono">{item.email}</span>.
            </li>
            <li>Salin nama, keahlian, latar, tautan L1/L2, dan usulan kursus dari jawaban di atas.</li>
            <li>Jangan publikasikan sampai onboarding selesai.</li>
          </ol>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Approve tidak membuat profil mentor live. Salin ke{" "}
        <Link href="/admin/mentors" className="underline">
          Admin → Mentor
        </Link>{" "}
        secara terpisah.
      </p>
    </div>
  );
}
