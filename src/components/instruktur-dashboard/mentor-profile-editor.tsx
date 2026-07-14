"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchMentorDashboardProfile,
  updateMentorDashboardProfile,
  type MentorDashboardProfile,
} from "@/lib/instruktur-dashboard/api";

export function MentorProfileEditor() {
  const [profile, setProfile] = useState<MentorDashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchMentorDashboardProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setBio(data.bio);
        setTagline(data.tagline ?? "");
        setInstagram(data.socialLinks?.instagram ?? "");
        setYoutube(data.socialLinks?.youtube ?? "");
        setTwitter(data.socialLinks?.twitter ?? "");
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSaved(false);
    try {
      const updated = await updateMentorDashboardProfile({
        bio: bio.trim(),
        tagline: tagline.trim() || null,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          youtube: youtube.trim() || undefined,
          twitter: twitter.trim() || undefined,
        },
      });
      setProfile(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="surface-card p-6 text-center text-sm text-destructive">
        {error ?? "Profil tidak ditemukan."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Edit Profil Mentor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Perubahan tercermin di halaman publik instruktur.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          render={
            <Link href={`/instruktur/${profile.slug}`} target="_blank" rel="noopener noreferrer" />
          }
        >
          <ExternalLink className="size-4" />
          Pratinjau Profil Publik
        </Button>
      </div>

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status verifikasi</span>
          <Badge variant="outline">{profile.verificationStatus}</Badge>
          <span className="text-xs text-muted-foreground">(hanya admin yang dapat mengubah)</span>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Bio (100–800 karakter)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            minLength={100}
            maxLength={800}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <span className="text-xs text-muted-foreground">{bio.length}/800</span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tagline (maks. 80 karakter)</span>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Spesialisasi singkat untuk profil publik"
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground">Link sosial (opsional)</legend>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="https://x.com/..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </fieldset>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan profil"}
          </Button>
          {saved && <span className="text-xs text-emerald">Profil diperbarui.</span>}
        </div>
      </div>
    </form>
  );
}
