/**
 * Public demo SSOT: single-decision funnel (GT /decide 2026-09-11).
 * Guest surfaces: consume demo → waitlist. No tier theater on UI.
 */

export type AuthSurfaceState =
  | "guest_preview_ok"
  | "guest_locked_content"
  | "guest_feature_waitlist"
  | "logged_in_no_entitlement"
  | "logged_in_full";

export const AUTH_CTA = {
  primaryWaitlist: "Gabung waitlist",
  previewWatch: "Tonton preview",
  previewOther: "Preview lesson lain",
  backWaitlist: "Kembali ke waitlist",
} as const;

export const AUTH_SURFACE_COPY: Record<
  AuthSurfaceState,
  {
    headline: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
  }
> = {
  guest_preview_ok: {
    headline: "Mulai dari preview",
    sub: "Jelajahi demo tanpa akun.",
    primaryCta: AUTH_CTA.previewWatch,
    secondaryCta: AUTH_CTA.primaryWaitlist,
  },
  guest_locked_content: {
    headline: "Lesson ini bagian dari demo",
    sub: "Tonton preview gratis atau gabung waitlist untuk kabar peluncuran.",
    primaryCta: AUTH_CTA.previewOther,
    secondaryCta: AUTH_CTA.primaryWaitlist,
  },
  guest_feature_waitlist: {
    headline: "Fitur ini belum dibuka",
    sub: "Platform masih dalam demo publik. Gabung waitlist untuk early access.",
    primaryCta: AUTH_CTA.primaryWaitlist,
    secondaryCta: AUTH_CTA.backWaitlist,
  },
  logged_in_no_entitlement: {
    headline: "Akses terbatas saat ini",
    sub: "Konten lengkap akan dibuka setelah peluncuran batch pertama.",
    primaryCta: AUTH_CTA.primaryWaitlist,
    secondaryCta: AUTH_CTA.previewWatch,
  },
  logged_in_full: {
    headline: "Lanjutkan belajar",
    sub: "",
    primaryCta: "Lanjutkan",
    secondaryCta: "",
  },
};

/** Locked overlay line on lesson player */
export const LOCKED_LESSON_LINE = "Preview demo: konten penuh setelah peluncuran";

/** /daftar → waitlist explainer */
export const DAFTAR_CLOSED_EXPLAINER = {
  headline: "Pendaftaran belum dibuka",
  sub: "Kami sedang mengundang pengguna secara bertahap selama fase early access.",
  primaryCta: AUTH_CTA.primaryWaitlist,
  secondaryCta: "Lihat katalog",
} as const;

/** Signed-out settings / pengaturan: waitlist-only, no tier ladder */
export const DEMO_WAITLIST_EXPLAINER = {
  headline: "Demo publik Bursanalar",
  sub: "Jelajahi katalog, preview lesson, dan quiz tanpa akun. Gabung waitlist untuk kabar early access.",
  primaryCta: AUTH_CTA.primaryWaitlist,
} as const;
