"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { canMutateMentor } from "@/lib/auth/roles";

export default function MentorProfilePage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);
  const [displayName, setDisplayName] = useState(session?.name ?? "Mentor Bursa");
  const [headline, setHeadline] = useState("Mentor trading & analisis pasar");
  const [bio, setBio] = useState(
    "Membimbing trader melalui kurikulum terstruktur, sinyal terverifikasi, dan komunitas yang aman."
  );
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
        <h1 className="font-heading text-2xl font-semibold">Identitas Mentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profil publik yang tampil di katalog, komunitas, dan halaman instruktur.
        </p>
      </div>

      <form onSubmit={handleSave} className="surface-card space-y-4 p-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Nama tampilan</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Headline</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            disabled={readOnly}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Bio singkat</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={readOnly}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Email akun</span>
          <input
            value={session?.email ?? ""}
            disabled
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm opacity-70"
          />
        </label>
        {!readOnly && (
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm">
              Simpan profil
            </Button>
            {saved && <span className="text-xs text-emerald">Tersimpan (prototype lokal).</span>}
          </div>
        )}
      </form>
    </div>
  );
}
