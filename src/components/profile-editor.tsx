"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Loader2, Settings, X } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { isValidIndonesianPhone, normalizeIndonesianPhone } from "@/lib/auth/validation";
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type ProfilePayload = {
  id: string;
  email: string;
  name: string;
  username: string | null;
  phone: string | null;
  bio: string;
  avatarUrl: string | null;
  role: string;
};

type ProfileSnapshot = {
  name: string;
  username: string;
  phone: string;
  bio: string;
  avatarUrl: string | null;
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

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

function roleBadgeVariant(role: UserRole): "accent" | "secondary" | "default" {
  switch (role) {
    case "mentor":
      return "accent";
    case "admin":
      return "default";
    default:
      return "secondary";
  }
}

export function ProfileEditor() {
  const { session, isLoading, updateLocalProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saved, setSaved] = useState<ProfileSnapshot>({
    name: "",
    username: "",
    phone: "",
    bio: "",
    avatarUrl: null,
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) return;

    const fromSession: ProfileSnapshot = {
      name: session.name ?? "",
      username: session.username ?? "",
      phone: session.phone ?? "",
      bio: session.bio ?? "",
      avatarUrl: session.avatarUrl ?? null,
    };
    setName(fromSession.name);
    setUsername(fromSession.username);
    setPhone(fromSession.phone);
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
          username: data.profile.username ?? "",
          phone: data.profile.phone ?? "",
          bio: data.profile.bio ?? "",
          avatarUrl: data.profile.avatarUrl,
        };
        setName(next.name);
        setUsername(next.username);
        setPhone(next.phone);
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
          username: next.username || null,
          phone: next.phone || null,
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
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
    };
  }, [previewUrl]);

  function scheduleUsernameCheck(value: string, profileId?: string) {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    const normalized = value.trim().toLowerCase();
    if (!normalized || !USERNAME_PATTERN.test(normalized) || normalized === saved.username) {
      setUsernameCheck("idle");
      return;
    }
    setUsernameCheck("checking");
    usernameTimer.current = setTimeout(() => {
      const params = new URLSearchParams({ username: normalized });
      if (profileId) params.set("excludeUserId", profileId);
      void fetch(`/api/auth/check-username?${params}`)
        .then(async (res) => {
          const data = (await res.json()) as { available?: boolean };
          if (!res.ok) {
            setUsernameCheck("idle");
            return;
          }
          setUsernameCheck(data.available ? "available" : "taken");
        })
        .catch(() => setUsernameCheck("idle"));
    }, 400);
  }

  const isDirty = useMemo(() => {
    if (pendingFile) return true;
    if (name.trim() !== saved.name.trim()) return true;
    if (username.trim().toLowerCase() !== saved.username.trim().toLowerCase()) return true;
    if (phone.trim() !== saved.phone.trim()) return true;
    if (normalizeBio(bio) !== normalizeBio(saved.bio)) return true;
    if ((avatarUrl ?? null) !== (saved.avatarUrl ?? null)) return true;
    return false;
  }, [name, username, phone, bio, avatarUrl, pendingFile, saved]);

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
    const normalizedUsername = username.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setMessage({ type: "err", text: "Nama tampilan minimal 2 karakter." });
      return;
    }
    if (normalizedUsername && !USERNAME_PATTERN.test(normalizedUsername)) {
      setMessage({
        type: "err",
        text: "Username 3–30 karakter, huruf kecil, angka, dan underscore.",
      });
      return;
    }
    if (usernameCheck === "taken") {
      setMessage({ type: "err", text: "Username sudah dipakai." });
      return;
    }
    if (trimmedPhone) {
      const normalizedPhone = normalizeIndonesianPhone(trimmedPhone);
      if (!isValidIndonesianPhone(normalizedPhone)) {
        setMessage({ type: "err", text: "Format nomor telepon tidak valid (+62)." });
        return;
      }
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

      const normalizedPhone = trimmedPhone ? normalizeIndonesianPhone(trimmedPhone) : null;

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
          username: normalizedUsername || null,
          phone: normalizedPhone,
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
        username: profile.username ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        avatarUrl: profile.avatarUrl,
      };
      setName(next.name);
      setUsername(next.username);
      setPhone(next.phone);
      setBio(next.bio);
      setAvatarUrl(next.avatarUrl);
      setSaved(next);
      setPendingFile(null);
      setUsernameCheck("idle");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      updateLocalProfile({
        name: next.name,
        username: next.username || null,
        phone: next.phone || null,
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
  const canSave = isDirty && !saving && !loadingProfile && usernameCheck !== "taken";

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={roleBadgeVariant(session.role)} className="rounded-full px-3 py-1 text-xs">
            {ROLE_LABELS[session.role]}
          </Badge>
          {session.username && (
            <p className="text-xs font-mono text-muted-foreground">@{session.username}</p>
          )}
          <p className="text-xs text-muted-foreground">{session.email}</p>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/pengaturan" />}>
          <Settings className="size-3.5" />
          Pengaturan akun
        </Button>
      </div>

      <form onSubmit={handleSave} className="surface-card space-y-5 p-5">
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
          <span className="text-xs font-medium text-muted-foreground">Nama tampilan</span>
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
          <span className="text-xs font-medium text-muted-foreground">Username</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <input
              value={username}
              onChange={(e) => {
                const nextValue = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                setUsername(nextValue);
                scheduleUsernameCheck(nextValue);
              }}
              disabled={saving || loadingProfile}
              maxLength={30}
              autoComplete="username"
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-9 text-sm disabled:opacity-60"
              placeholder="username_kamu"
            />
            {usernameCheck === "checking" && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {usernameCheck === "available" && (
              <Check className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
            )}
            {usernameCheck === "taken" && (
              <X className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
            )}
          </div>
          <span className="block text-[11px] text-muted-foreground">
            Dipakai untuk masuk dan mention di chat. Huruf kecil, angka, underscore.
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Nomor telepon</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving || loadingProfile}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
            placeholder="+62812xxxxxxx (opsional)"
          />
          <span className="block text-[11px] text-muted-foreground">
            Format Indonesia (+62). Bisa dipakai untuk masuk.
          </span>
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
              "Simpan profil"
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
    </div>
  );
}
