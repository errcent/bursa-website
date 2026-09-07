import {
  internalTrustPath,
  isProductionHostRouting,
  legalHrefsFor,
  trustPublicPath,
  type LegalLocale,
} from "@/lib/hosts/hosts";

export type ControlStatus = "done" | "partial" | "planned";
export type FrameworkStatus = "in_progress" | "delegated" | "roadmap" | "planned";
export type TrustTab = "overview" | "controls" | "resources";

export function trustPortalHrefs(locale: LegalLocale) {
  const path = (slug: string) =>
    isProductionHostRouting() ? trustPublicPath(slug, locale) : internalTrustPath(slug, locale);
  const legal = legalHrefsFor(locale);
  return {
    hub: path("hub"),
    security: path("keamanan"),
    controls: path("kontrol"),
    compliance: path("kepatuhan"),
    report: path("pelaporan"),
    resources: path("sumber-daya"),
    faq: path("faq"),
    privacy: legal.privacy,
    privacyPolicy: legal.privacyPolicy,
    cookies: legal.cookies,
    dsar: legal.dsar,
    terms: legal.terms,
    request: `${path("sumber-daya")}#request`,
  };
}

export function tabForTrustSlug(slug: string | undefined): TrustTab | null {
  if (!slug || slug === "hub") return "overview";
  if (slug === "kontrol") return "controls";
  if (slug === "sumber-daya") return "resources";
  return null;
}

const COPY = {
  id: {
    centerName: "Pusat Kepercayaan Bursa",
    product: "Bursanalar",
    heroLead:
      "Register publik keamanan dan kepatuhan PT Global Makmur Madani. Bukan broker. Bukan janji sertifikasi.",
    heroBody:
      "Kami menampilkan kontrol yang benar-benar berjalan, yang masih parsial, dan yang masih di roadmap. Tidak ada stempel SOC 2 atau ISO 27001 di sini — karena kami belum memilikinya.",
    privacyStatement:
      "PT Global Makmur Madani adalah pengendali data. Notes pelajar bersifat privat (admin tidak dapat membaca). Permintaan hak subjek data melalui Pusat Privasi. Laporkan kerentanan ke security@bursanalar.com.",
    lastPublished: "Diterbitkan 22 Juli 2026",
    governing: "Bahasa Indonesia yang mengikat. Inggris hanya terjemahan kemudahan.",
    requestCta: "Minta informasi",
    securityEmail: "security@bursanalar.com",
    privacyLink: "Kebijakan Privasi",
    overview: "Ikhtisar",
    controls: "Kontrol",
    resources: "Sumber daya",
    compliance: "Kerangka",
    viewAll: "Lihat semua",
    commitmentsTitle: "Komitmen yang bisa dicek",
    frameworksTitle: "Status kerangka",
    frameworksLead: "Status jujur — bukan lencana pemasaran.",
    controlsLead: "Matriks publik. Detail internal tidak dipublikasikan.",
    resourcesLead: "Dokumen yang bisa dibuka tanpa NDA. Laporan audit belum ada.",
    requestTitle: "Minta paket keamanan",
    requestLead:
      "Untuk due diligence vendor, kuesioner keamanan, atau DPA. Kami tidak memiliki laporan SOC 2 / ISO untuk dibagikan.",
    skipNav: "Lewati ke navigasi",
    skipMain: "Lewati ke konten",
    official: "Pusat Kepercayaan resmi · first-party · $0 (bukan Vanta)",
    back: "Kembali ke ikhtisar",
  },
  en: {
    centerName: "Bursa Trust Center",
    product: "Bursanalar",
    heroLead:
      "Public security and compliance register of PT Global Makmur Madani. Not a broker. No certification theatre.",
    heroBody:
      "We show controls that are live, partial, or still on the roadmap. There is no SOC 2 or ISO 27001 seal here — we do not hold those certifications.",
    privacyStatement:
      "PT Global Makmur Madani is the data controller. Learner Notes are private (admins cannot read them). Data-subject requests go through the Privacy Center. Report vulnerabilities to security@bursanalar.com.",
    lastPublished: "Published 22 July 2026",
    governing: "Indonesian governs. English is a convenience translation.",
    requestCta: "Request information",
    securityEmail: "security@bursanalar.com",
    privacyLink: "Privacy Policy",
    overview: "Overview",
    controls: "Controls",
    resources: "Resources",
    compliance: "Frameworks",
    viewAll: "View all",
    commitmentsTitle: "Commitments you can inspect",
    frameworksTitle: "Framework status",
    frameworksLead: "Honest status — not marketing badges.",
    controlsLead: "Public matrix. Internal detail is withheld.",
    resourcesLead: "Documents you can open without an NDA. No audit report exists yet.",
    requestTitle: "Request a security pack",
    requestLead:
      "For vendor due diligence, security questionnaires, or a DPA. We do not have a SOC 2 / ISO report to share.",
    skipNav: "Skip to navigation",
    skipMain: "Skip to content",
    official: "Official Trust Center · first-party · $0 (not Vanta)",
    back: "Back to overview",
  },
} as const;

export function trustCopy(locale: LegalLocale) {
  return COPY[locale];
}

export const COMMITMENTS = [
  {
    id: "privacy",
    idLabel: "Privasi by design",
    enLabel: "Privacy by design",
    idBody: "Minimisasi data, masking PII, Notes pelajar 100% privat.",
    enBody: "Data minimisation, PII masking, learner Notes 100% private.",
  },
  {
    id: "layered",
    idLabel: "Keamanan berlapis",
    enLabel: "Layered security",
    idBody: "TLS, bcrypt, RBAC, validasi Zod, Prisma, audit log.",
    enBody: "TLS, bcrypt, RBAC, Zod validation, Prisma, audit logs.",
  },
  {
    id: "reg",
    idLabel: "Postur regulasi",
    enLabel: "Regulatory posture",
    idBody: "UU PDP dalam implementasi, POJK 6/2026, PCI didelegasikan.",
    enBody: "UU PDP in implementation, POJK 6/2026, PCI delegated.",
  },
  {
    id: "honest",
    idLabel: "Transparansi jujur",
    enLabel: "Honest transparency",
    idBody: "Tidak mengklaim sertifikasi yang belum dimiliki.",
    enBody: "We do not claim certifications we have not earned.",
  },
] as const;

export const FRAMEWORKS: {
  id: string;
  idName: string;
  enName: string;
  status: FrameworkStatus;
  idStatus: string;
  enStatus: string;
  idNote: string;
  enNote: string;
}[] = [
  {
    id: "pdp",
    idName: "UU PDP",
    enName: "UU PDP",
    status: "in_progress",
    idStatus: "Dalam implementasi",
    enStatus: "In implementation",
    idNote: "Kontrol dasar aktif. DPO formal dan ekspor/hapus penuh sebelum peluncuran.",
    enNote: "Basic controls are live. Formal DPO and full export/delete before launch.",
  },
  {
    id: "pci",
    idName: "PCI-DSS",
    enName: "PCI-DSS",
    status: "delegated",
    idStatus: "Didelegasikan",
    enStatus: "Delegated",
    idNote: "Tidak menyimpan PAN/CVV. Target SAQ A via hosted payment page.",
    enNote: "No PAN/CVV stored. Target SAQ A via a hosted payment page.",
  },
  {
    id: "pojk6",
    idName: "POJK 6/2026",
    enName: "POJK 6/2026",
    status: "in_progress",
    idStatus: "Kebijakan konten",
    enStatus: "Content policy",
    idNote: "Tidak menjanjikan profit. Review kurikulum mentor sebelum tayang.",
    enNote: "No profit promises. Mentor curriculum reviewed before publish.",
  },
  {
    id: "soc2",
    idName: "SOC 2 Type II",
    enName: "SOC 2 Type II",
    status: "roadmap",
    idStatus: "Roadmap",
    enStatus: "Roadmap",
    idNote: "Belum dimiliki. Penilaian kesiapan direncanakan 2027.",
    enNote: "Not held. Readiness assessment planned for 2027.",
  },
  {
    id: "iso",
    idName: "ISO 27001",
    enName: "ISO 27001",
    status: "roadmap",
    idStatus: "Roadmap",
    enStatus: "Roadmap",
    idNote: "Belum dimiliki. Dipakai sebagai checklist, bukan klaim.",
    enNote: "Not held. Used as a checklist, not a claim.",
  },
  {
    id: "pse",
    idName: "PSE Kominfo",
    enName: "PSE Kominfo",
    status: "planned",
    idStatus: "Direncanakan",
    enStatus: "Planned",
    idNote: "Pendaftaran sebelum peluncuran publik skala penuh.",
    enNote: "Registration before a full public launch.",
  },
];

export const CONTROL_GROUPS: {
  id: string;
  idTitle: string;
  enTitle: string;
  items: {
    id: string;
    idLabel: string;
    enLabel: string;
    idDetail: string;
    enDetail: string;
    status: ControlStatus;
  }[];
}[] = [
  {
    id: "technical",
    idTitle: "Keamanan teknis",
    enTitle: "Technical security",
    items: [
      { id: "tls", idLabel: "TLS 1.2+", enLabel: "TLS 1.2+", idDetail: "Enkripsi semua komunikasi client–server", enDetail: "Encryption for all client–server traffic", status: "done" },
      { id: "bcrypt", idLabel: "bcrypt password", enLabel: "bcrypt passwords", idDetail: "Hash kata sandi cost ≥ 12", enDetail: "Password hashes at cost ≥ 12", status: "done" },
      { id: "rbac", idLabel: "RBAC", enLabel: "RBAC", idDetail: "Kontrol akses berbasis peran di API & admin", enDetail: "Role-based access on API and admin", status: "done" },
      { id: "rate", idLabel: "Rate limiting", enLabel: "Rate limiting", idDetail: "Throttle endpoint auth & API", enDetail: "Throttles on auth and API endpoints", status: "done" },
      { id: "zod", idLabel: "Validasi input", enLabel: "Input validation", idDetail: "Skema Zod di API routes", enDetail: "Zod schemas on API routes", status: "done" },
      { id: "sql", idLabel: "Pencegahan SQLi", enLabel: "SQLi prevention", idDetail: "Prisma ORM parameterized queries", enDetail: "Prisma ORM parameterized queries", status: "done" },
      { id: "xss", idLabel: "Pencegahan XSS", enLabel: "XSS prevention", idDetail: "React auto-escape + DOMPurify", enDetail: "React auto-escape + DOMPurify", status: "done" },
      { id: "csrf", idLabel: "CSRF", enLabel: "CSRF", idDetail: "Token pada form sensitif", enDetail: "Tokens on sensitive forms", status: "partial" },
      { id: "audit", idLabel: "Audit logging", enLabel: "Audit logging", idDetail: "Log akses data sensitif", enDetail: "Logs for sensitive data access", status: "partial" },
      { id: "field", idLabel: "Enkripsi field KYC", enLabel: "KYC field encryption", idDetail: "Kolom KYC/bank at-rest — belum", enDetail: "KYC/bank columns at rest — not yet", status: "planned" },
    ],
  },
  {
    id: "org",
    idTitle: "Keamanan organisasi",
    enTitle: "Organizational security",
    items: [
      { id: "ir", idLabel: "Incident response", enLabel: "Incident response", idDetail: "SOP kebocoran 3×24 jam", enDetail: "3×24h breach SOP", status: "done" },
      { id: "train", idLabel: "Pelatihan keamanan", enLabel: "Security training", idDetail: "Onboarding engineer", enDetail: "Engineer onboarding", status: "done" },
      { id: "change", idLabel: "Change management", enLabel: "Change management", idDetail: "PR review untuk kode sensitif", enDetail: "PR review on sensitive code", status: "done" },
      { id: "vendor", idLabel: "Vendor assessment", enLabel: "Vendor assessment", idDetail: "Review sub-prosesor", enDetail: "Sub-processor review", status: "partial" },
      { id: "access", idLabel: "Access review", enLabel: "Access review", idDetail: "Review akses admin berkala", enDetail: "Periodic admin access review", status: "planned" },
      { id: "mfa", idLabel: "MFA admin", enLabel: "Admin MFA", idDetail: "Wajib MFA admin — Q3 2026", enDetail: "Mandatory admin MFA — Q3 2026", status: "planned" },
      { id: "pentest", idLabel: "Pentest eksternal", enLabel: "External pentest", idDetail: "Direncanakan pra-peluncuran", enDetail: "Planned pre-launch", status: "planned" },
    ],
  },
  {
    id: "access",
    idTitle: "Akses admin (publik)",
    enTitle: "Admin access (public)",
    items: [
      { id: "notes", idLabel: "Notes pelajar", enLabel: "Learner Notes", idDetail: "Hard deny — tidak ada break-glass", enDetail: "Hard deny — no break-glass", status: "done" },
      { id: "cards", idLabel: "Data kartu", enLabel: "Card data", idDetail: "Tidak disimpan; akses admin ×", enDetail: "Not stored; admin access denied", status: "done" },
      { id: "password", idLabel: "Password / hash", enLabel: "Passwords / hashes", idDetail: "Admin tidak dapat membaca", enDetail: "Admins cannot read them", status: "done" },
      { id: "email", idLabel: "Email pengguna", enLabel: "User email", idDetail: "Masked untuk admin & support", enDetail: "Masked for admin and support", status: "partial" },
      { id: "kyc", idLabel: "KYC mentor", enLabel: "Mentor KYC", idDetail: "Hanya compliance, expiry 24 jam", enDetail: "Compliance only, 24h expiry", status: "partial" },
    ],
  },
];

export const RESOURCES = [
  {
    hrefKey: "security",
    idTitle: "Program keamanan",
    enTitle: "Security program",
    idBody: "Arsitektur, vendor, dan ruang lingkup program.",
    enBody: "Architecture, vendors, and program scope.",
  },
  {
    hrefKey: "controls",
    idTitle: "Matriks kontrol",
    enTitle: "Control matrix",
    idBody: "Kontrol teknis, organisasi, dan akses admin.",
    enBody: "Technical, organizational, and admin-access controls.",
  },
  {
    hrefKey: "compliance",
    idTitle: "Kepatuhan regulasi",
    enTitle: "Regulatory compliance",
    idBody: "UU PDP, POJK, PCI, GDPR-ready, PSE.",
    enBody: "UU PDP, POJK, PCI, GDPR-ready, PSE.",
  },
  {
    hrefKey: "report",
    idTitle: "Pelaporan kerentanan",
    enTitle: "Vulnerability reporting",
    idBody: "Responsible disclosure ke security@.",
    enBody: "Responsible disclosure to security@.",
  },
  {
    hrefKey: "faq",
    idTitle: "FAQ keamanan",
    enTitle: "Security FAQ",
    idBody: "SOC 2, bug bounty, dan klaim yang kami tolak.",
    enBody: "SOC 2, bug bounty, and claims we refuse.",
  },
] as const;

export const EXTERNAL_RESOURCES = [
  { key: "privacy" as const, idTitle: "Pusat Privasi", enTitle: "Privacy Center" },
  { key: "privacyPolicy" as const, idTitle: "Kebijakan Privasi", enTitle: "Privacy Policy" },
  { key: "cookies" as const, idTitle: "Kebijakan cookie", enTitle: "Cookie policy" },
  { key: "dsar" as const, idTitle: "Permintaan data (DSAR)", enTitle: "Data request (DSAR)" },
  { key: "terms" as const, idTitle: "Syarat & ketentuan", enTitle: "Terms of service" },
] as const;

export function frameworkStampClass(status: FrameworkStatus): string {
  if (status === "in_progress" || status === "delegated") return "trust-stamp trust-stamp-partial";
  return "trust-stamp trust-stamp-planned";
}

export function controlStampClass(status: ControlStatus): string {
  if (status === "done") return "trust-stamp trust-stamp-done";
  if (status === "partial") return "trust-stamp trust-stamp-partial";
  return "trust-stamp trust-stamp-planned";
}

export function controlStampLabel(status: ControlStatus, locale: LegalLocale): string {
  if (status === "done") return locale === "en" ? "Live" : "Aktif";
  if (status === "partial") return locale === "en" ? "Partial" : "Parsial";
  return locale === "en" ? "Planned" : "Rencana";
}
