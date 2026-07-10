"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfilePayload = {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  role: string;
};

type ProfileSnapshot = {
  name: string;
  bio: string;
  avatarUrl: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeBio(value: string) {
  return value.trim();
}

export function SettingsProfile() {
  const { session, isLoading, updateLocalProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saved, setSaved] = useState<ProfileSnapshot>({
    name: "",
    bio: "",
    avatarUrl: null,
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!session) return;

    const fromSession: ProfileSnapshot = {
      name: session.name ?? "",
      bio: session.bio ?? "",
      avatarUrl: session.avatarUrl ?? null,
    };
    setName(fromSession.name);
    setBio(fromSession.bio);
    setAvatarUrl(fromSession.avatarUrl);
    setSaved(fromSession);

    let cancelled = false;
    setLoadingProfile(true);

    void fetch("/api/me/profile", {
      cache: "no-store",
      headers: {
        ...(session.email ? { "x-user-email": session.email } : {}),
        ...(session.userId ? { "x-user-id": session.userId } : {}),
        ...(session.name ? { "x-user-name": session.name } : {}),
        ...(session.role ? { "x-user-role": session.role } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return (await res.json()) as { profile: ProfilePayload };
      })
      .then((data) => {
        if (cancelled) return;
        const next: ProfileSnapshot = {
          name: data.profile.name,
          bio: data.profile.bio ?? "",
          avatarUrl: data.profile.avatarUrl,
        };
        setName(next.name);
        setBio(next.bio);
        setAvatarUrl(next.avatarUrl);
        setSaved(next);
        setPendingFile(null);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        updateLocalProfile({
          name: next.name,
          bio: next.bio,
          avatarUrl: next.avatarUrl,
        });
      })
      .catch(() => {
        // Keep session defaults when API is unavailable.
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.userId, session?.email, updateLocalProfile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isDirty = useMemo(() => {
    if (pendingFile) return true;
    if (name.trim() !== saved.name.trim()) return true;
    if (normalizeBio(bio) !== normalizeBio(saved.bio)) return true;
    if ((avatarUrl ?? null) !== (saved.avatarUrl ?? null)) return true;
    return false;
  }, [name, bio, avatarUrl, pendingFile, saved]);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session) {
    return null;
  }

  function onPickFile(file: File | null) {
    setMessage(null);
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setMessage({ type: "err", text: "Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "err", text: "Ukuran foto maksimal 2 MB." });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session || saving || !isDirty) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setMessage({ type: "err", text: "Nama pengguna minimal 2 karakter." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let nextAvatar = avatarUrl;

      if (pendingFile) {
        const form = new FormData();
        form.set("file", pendingFile);
        form.set("email", session.email);
        form.set("userId", session.userId);
        form.set("name", trimmedName);
        form.set("role", session.role);

        const uploadRes = await fetch("/api/me/avatar", {
          method: "POST",
          headers: {
            "x-user-email": session.email,
            "x-user-id": session.userId,
          },
          body: form,
        });
        const uploadJson = (await uploadRes.json()) as {
          avatarUrl?: string;
          error?: string;
        };
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || "Gagal mengunggah foto profil.");
        }
        nextAvatar = uploadJson.avatarUrl ?? nextAvatar;
      }

      const patchRes = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": session.email,
          "x-user-id": session.userId,
          "x-user-name": trimmedName,
          "x-user-role": session.role,
        },
        body: JSON.stringify({
          userId: session.userId,
          email: session.email,
          name: trimmedName,
          bio: bio.trim(),
          avatarUrl: nextAvatar,
          role: session.role,
        }),
      });

      const patchJson = (await patchRes.json()) as {
        profile?: ProfilePayload;
        error?: string;
      };
      if (!patchRes.ok || !patchJson.profile) {
        throw new Error(patchJson.error || "Gagal menyimpan profil.");
      }

      const profile = patchJson.profile;
      const next: ProfileSnapshot = {
        name: profile.name,
        bio: profile.bio ?? "",
        avatarUrl: profile.avatarUrl,
      };
      setName(next.name);
      setBio(next.bio);
      setAvatarUrl(next.avatarUrl);
      setSaved(next);
      setPendingFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      updateLocalProfile({
        name: next.name,
        bio: next.bio,
        avatarUrl: next.avatarUrl,
      });

      setMessage({ type: "ok", text: "Profil berhasil disimpan." });
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "Gagal menyimpan profil.",
      });
    } finally {
      setSaving(false);
    }
  }

  const displayAvatar = previewUrl || avatarUrl;
  const canSave = isDirty && !saving && !loadingProfile;

  return (
    <section id="profil" className="scroll-mt-24">
      <h2 className="section-title">Profil</h2>
      <p className="section-copy mt-1">
        Foto, nama pengguna, dan bio yang tampil di komunitas dan dashboard.
      </p>

      <form onSubmit={handleSave} className="surface-card mt-6 space-y-5 p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <Avatar className="!size-20">
              {displayAvatar && <AvatarImage src={displayAvatar} alt={name || "Foto profil"} />}
              <AvatarFallback className="text-lg">
                {initials(name || session.name || "U")}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || loadingProfile}
              className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
              aria-label="Unggah foto profil"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Foto profil</p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WebP, atau GIF. Maksimal 2 MB.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={saving || loadingProfile}
              onClick={() => fileInputRef.current?.click()}
            >
              Pilih foto
            </Button>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Nama pengguna</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving || loadingProfile}
            maxLength={80}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            placeholder="Nama tampilan"
            autoComplete="nickname"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={saving || loadingProfile}
            rows={4}
            maxLength={500}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            placeholder="Ceritakan singkat tentang dirimu (opsional)"
          />
          <span className="block text-right text-[11px] text-muted-foreground">
            {bio.length}/500
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="submit"
            size="sm"
            className={cn("btn-primary", !canSave && "opacity-40")}
            disabled={!canSave}
            aria-disabled={!canSave}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </Button>
          {message && (
            <span
              className={cn(
                "text-xs",
                message.type === "ok" ? "text-emerald-500" : "text-destructive"
              )}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
