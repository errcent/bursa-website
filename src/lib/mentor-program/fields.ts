export const L1_EXPERTISE_OPTIONS = [
  { value: "trading", label: "Trading" },
  { value: "technical_analysis", label: "Analisis teknikal" },
  { value: "fundamental_analysis", label: "Analisis fundamental" },
  { value: "macro", label: "Makro" },
  { value: "economics", label: "Ekonomi" },
  { value: "quantitative_finance", label: "Keuangan kuantitatif" },
  { value: "portfolio_management", label: "Manajemen portofolio" },
  { value: "risk_management", label: "Manajemen risiko" },
  { value: "options", label: "Opsi" },
  { value: "futures", label: "Futures" },
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Kripto" },
  { value: "commodities", label: "Komoditas" },
  { value: "equities", label: "Saham / ekuitas" },
  { value: "other", label: "Lainnya" },
] as const;

export type L1ExpertiseValue = (typeof L1_EXPERTISE_OPTIONS)[number]["value"];

export const L1_YEARS_OPTIONS = [
  { value: "lt_1", label: "Kurang dari 1 tahun" },
  { value: "1_3", label: "1–3 tahun" },
  { value: "3_5", label: "3–5 tahun" },
  { value: "5_10", label: "5–10 tahun" },
  { value: "10_plus", label: "10+ tahun" },
] as const;

export type L1YearsValue = (typeof L1_YEARS_OPTIONS)[number]["value"];

export const L2_TAUGHT_WHO_OPTIONS = [
  { value: "retail_traders", label: "Trader ritel" },
  { value: "professional_traders", label: "Trader profesional" },
  { value: "students", label: "Mahasiswa / siswa" },
  { value: "colleagues", label: "Rekan kerja" },
  { value: "clients", label: "Klien" },
  { value: "community", label: "Komunitas" },
  { value: "other", label: "Lainnya" },
] as const;

export const L2_TARGET_STUDENT_OPTIONS = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Mahir" },
  { value: "professional", label: "Profesional / institusi" },
] as const;

export const L2_CLAIMS_EVIDENCE_OPTIONS = [
  { value: "yes", label: "Ya" },
  { value: "no", label: "Tidak" },
  { value: "not_applicable", label: "Tidak berlaku" },
  { value: "mixed", label: "Sebagian publik, sebagian privat" },
] as const;

export const L2_TOKEN_TTL_DAYS = 21;

export const L2_SECTIONS = [
  { id: "background", label: "Latar profesional" },
  { id: "domain", label: "Domain" },
  { id: "evidence", label: "Bukti" },
  { id: "teaching", label: "Mengajar" },
  { id: "sample", label: "Sampel mengajar" },
  { id: "course", label: "Usulan kursus" },
  { id: "integrity", label: "Integritas" },
  { id: "confirm", label: "Konfirmasi" },
] as const;
