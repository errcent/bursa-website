/**
 * Guest Access Matrix v2 — copy SSOT (GT Freeze 2026-09-11).
 * Progressive identity: Guest → Lite (P1) → Full.
 */

export type AuthSurfaceState =
  | "guest_preview_ok"
  | "guest_locked_content"
  | "guest_tier1_feature"
  | "logged_in_no_entitlement"
  | "logged_in_full";

export const AUTH_CTA = {
  primaryWaitlist: "Gabung waitlist",
  secondaryExistingAccount: "Sudah punya akun early access?",
  secondarySignIn: "Masuk",
  previewWatch: "Tonton preview",
  previewOther: "Preview lesson lain",
  backWaitlist: "Kembali ke waitlist",
  syncProgress: "Sinkronkan progress",
} as const;

export const AUTH_SURFACE_COPY: Record<
  AuthSurfaceState,
  {
    headline: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
    showGoogle: boolean;
  }
> = {
  guest_preview_ok: {
    headline: "Mulai belajar dari preview",
    sub: "Sebagian konten bisa diakses tanpa akun.",
    primaryCta: AUTH_CTA.previewWatch,
    secondaryCta: AUTH_CTA.primaryWaitlist,
    showGoogle: false,
  },
  guest_locked_content: {
    headline: "Konten penuh terkunci",
    sub: "Tonton preview atau gabung early access.",
    primaryCta: AUTH_CTA.previewOther,
    secondaryCta: AUTH_CTA.primaryWaitlist,
    showGoogle: false,
  },
  guest_tier1_feature: {
    headline: "Fitur ini untuk early access",
    sub: "Gabung waitlist — kami undang secara bertahap saat sistem siap.",
    primaryCta: AUTH_CTA.primaryWaitlist,
    secondaryCta: AUTH_CTA.secondarySignIn,
    showGoogle: false,
  },
  logged_in_no_entitlement: {
    headline: "Akses terbatas saat ini",
    sub: "Konten lengkap akan dibuka setelah peluncuran batch pertama.",
    primaryCta: AUTH_CTA.primaryWaitlist,
    secondaryCta: AUTH_CTA.previewWatch,
    showGoogle: true,
  },
  logged_in_full: {
    headline: "Lanjutkan belajar",
    sub: "",
    primaryCta: "Lanjutkan",
    secondaryCta: "",
    showGoogle: true,
  },
};

/** GT-17 / GT-18 — canonical locked-lesson line */
export const LOCKED_LESSON_LINE = "Konten penuh membutuhkan early access";

/** GT-09 / HOLD-05 B — guest progress localStorage 30 hari */
export const GUEST_PROGRESS_BANNER =
  "Progress tersimpan di perangkat ini (30 hari). Gabung waitlist untuk sinkron permanen.";

/** GT-05 — /daftar → waitlist explainer */
export const DAFTAR_CLOSED_EXPLAINER = {
  headline: "Pendaftaran belum dibuka",
  sub: "Kami sedang mengundang pengguna secara bertahap selama fase early access.",
  primaryCta: AUTH_CTA.primaryWaitlist,
  secondaryCta: "Lihat katalog",
} as const;

/** GT-15 — tier explainer for signed-out dashboard */
export const ACCESS_TIER_EXPLAINER = {
  headline: "Cara kerja akses Bursanalar",
  sub: "Guest → Early Access → Pembelajaran penuh",
  tiers: [
    {
      name: "Guest",
      detail: "Jelajahi katalog, tonton preview, ikuti quiz.",
    },
    {
      name: "Early access",
      detail: "Simpan progress, catatan, dan profil belajar.",
    },
    {
      name: "Penuh",
      detail: "Semua lesson — setelah peluncuran batch pertama.",
    },
  ],
} as const;
