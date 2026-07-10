"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { canMutateMentor } from "@/lib/auth/roles";

export default function MentorSettingsPage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);
  const [notifySignals, setNotifySignals] = useState(true);
  const [notifyQuestions, setNotifyQuestions] = useState(true);
  const [slowModeDefault, setSlowModeDefault] = useState("30");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengaturan Mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferensi notifikasi dan default moderasi untuk ruang Anda.
        </p>
      </div>

      <div className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Profil akun</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ubah foto profil, nama pengguna, dan bio dasar di pengaturan akun.
          </p>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/profil" />}>
          Edit profil
        </Button>
      </div>

      <form onSubmit={handleSave} className="surface-card space-y-5 p-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifySignals}
            onChange={(e) => setNotifySignals(e.target.checked)}
            disabled={readOnly}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Notifikasi sinyal</span>
            <span className="text-xs text-muted-foreground">
              Terima ringkasan saat sinyal di ruang Anda mendapat reaksi tinggi.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={notifyQuestions}
            onChange={(e) => setNotifyQuestions(e.target.checked)}
            disabled={readOnly}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Q&amp;A pelajaran</span>
            <span className="text-xs text-muted-foreground">
              Beri tahu saya saat ada pertanyaan baru di kelas yang saya ampu.
            </span>
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Slow mode default (detik)
          </span>
          <select
            value={slowModeDefault}
            onChange={(e) => setSlowModeDefault(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="0">Nonaktif</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </label>
        {!readOnly && (
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" size="sm">
              Simpan pengaturan
            </Button>
            {saved && <span className="text-xs text-emerald-500">Tersimpan (prototype lokal).</span>}
          </div>
        )}
      </form>
    </div>
  );
}
