/**
 * SSOT route matrix for visual audit (user-facing surface only).
 * Admin / developer routes are intentionally excluded.
 */

export type AuditRoute = {
  path: string;
  /** Filename-safe slug for screenshots */
  slug: string;
  /** Requires authenticated session for a meaningful audit */
  gated?: boolean;
};

const LAB_TOOLS = [
  "position-size",
  "risk-reward",
  "breakeven",
  "kelly-criterion",
  "monte-carlo",
  "trade-expectancy",
  "floating-calculator",
  "pip-value",
  "lot-size",
  "margin-leverage",
  "swap-rollover",
  "commission-slippage",
  "crypto-fee",
  "atr-trailing-stop",
  "fibonacci",
  "r-multiple",
] as const;

const PRIVASI_SLUGS = [
  "kebijakan",
  "cookie",
  "sub-prosesor",
  "permintaan-data",
  "faq",
] as const;

const KEPERCAYAAN_SLUGS = [
  "keamanan",
  "kontrol",
  "kepatuhan",
  "pelaporan",
  "sumber-daya",
  "faq",
] as const;

function route(path: string, opts?: { gated?: boolean; slug?: string }): AuditRoute {
  const derived =
    path
      .replace(/^\//, "")
      .replace(/[/?&=]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "home";
  const slug = opts?.slug ?? derived;
  return { path, slug, gated: opts?.gated };
}

export const AUDIT_ROUTES: AuditRoute[] = [
  // Marketing / core
  route("/"),
  route("/katalog"),
  route("/katalog?view=instruktur", { slug: "katalog-instruktur" }),
  route("/artikel"),
  route("/panduan-belajar"),
  route("/panduan-belajar/quiz"),
  route("/playlist"),
  route("/waitlist"),
  route("/wave-lab"),
  route("/komunitas"),
  route("/email-preferences"),

  // Auth
  route("/masuk"),
  route("/daftar"),
  route("/lupa-password"),
  route("/lupa-password/cek-email"),
  route("/lupa-password/reset"),
  route("/lupa-password/berhasil"),
  route("/verifikasi-email"),

  // Learner (gated)
  route("/dashboard", { gated: true }),
  route("/dashboard/tersimpan", { gated: true }),
  route("/profil", { gated: true }),
  route("/pengaturan", { gated: true }),
  route("/pengaturan?tab=account", { gated: true, slug: "pengaturan-account" }),
  route("/pengaturan?tab=devices", { gated: true, slug: "pengaturan-devices" }),
  route("/pengaturan?tab=payment", { gated: true, slug: "pengaturan-payment" }),

  // Lab
  route("/lab"),
  ...LAB_TOOLS.map((id) => route(`/lab/${id}`)),

  // About / help / mentor apply
  route("/tentang-kami"),
  route("/bantuan"),
  route("/jadi-mentor"),
  route("/jadi-mentor/sukses"),

  // Legal / trust / privacy
  route("/syarat-dan-ketentuan"),
  route("/privasi"),
  ...PRIVASI_SLUGS.map((s) => route(`/privasi/${s}`)),
  route("/kepercayaan"),
  ...KEPERCAYAAN_SLUGS.map((s) => route(`/kepercayaan/${s}`)),

  // Sample dynamic (prod catalog)
  route("/kelas/fundamental-saham-untuk-pemula"),
  route("/instruktur/andra-wicaksono"),
  route("/instruktur/andra-wicaksono/sesi"),
  route("/playlist/kesehatan-mental-trading"),
  route("/checkout/fundamental-saham-untuk-pemula"),
  route("/checkout/sukses"),
];

export function screenshotName(projectName: string, slug: string): string {
  return `${projectName}__${slug}.png`;
}
