import type { Instrument } from "@/lib/types";

export interface MentorBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface MentorRequirement {
  title: string;
  description: string;
  required: boolean;
}

export interface MentorProcessStep {
  step: string;
  title: string;
  description: string;
  duration: string;
}

export const mentorBenefits: MentorBenefit[] = [
  {
    icon: "wallet",
    title: "Pendapatan langsung ke kamu",
    description:
      "Murid membayar per kelas langsung ke akun mentor. Working model (indikatif): komisi platform ~25%, sisanya (~75%) milikmu. Rincian final sebelum konfirmasi.",
  },
  {
    icon: "users",
    title: "Audiens siap belajar",
    description:
      "Akses ke komunitas pelajar aktif yang mencari edukasi trading terstruktur, bukan konten random.",
  },
  {
    icon: "shield",
    title: "Kurasi & kepercayaan",
    description:
      "Proses kurasi mentor (kredensial + materi) sedang dibangun. Tim meninjau materi sebelum publikasi.",
  },
  {
    icon: "video",
    title: "Infrastruktur kelas lengkap",
    description:
      "Upload video, modul terstruktur, progress tracking, dan ruang komunitas, tanpa bangun platform sendiri.",
  },
  {
    icon: "message",
    title: "Komunitas & sinyal internal",
    description:
      "Kelola ruang diskusi berlevel dengan perlindungan konten anti-screenshot untuk member premium.",
  },
  {
    icon: "chart",
    title: "Dashboard & analitik",
    description:
      "Pantau enrollment, rating, pendapatan, dan engagement murid dari satu dashboard mentor.",
  },
];

export const mentorRequirements: MentorRequirement[] = [
  {
    title: "Pengalaman trading aktif minimal 2 tahun",
    description:
      "Bukti track record atau portofolio trading yang dapat diverifikasi (bukan hanya teori).",
    required: true,
  },
  {
    title: "Kemampuan mengajar terstruktur",
    description:
      "Mampu merancang kurikulum modul demi modul dengan outcome belajar yang jelas untuk murid.",
    required: true,
  },
  {
    title: "Kepatuhan regulasi & etika",
    description:
      "Tidak menjanjikan profit pasti. Menggunakan disclaimer risiko yang sesuai. Mematuhi ketentuan OJK terkait edukasi finansial.",
    required: true,
  },
  {
    title: "Sertifikasi profesional (opsional)",
    description:
      "CFA, CFP, WPPE, atau sertifikasi relevan lainnya meningkatkan prioritas review aplikasi.",
    required: false,
  },
  {
    title: "Konten sampel atau kelas sebelumnya",
    description:
      "Video pengenalan, webinar rekaman, atau materi edukasi yang sudah pernah dibuat (YouTube, blog, dll).",
    required: false,
  },
  {
    title: "Komitmen moderasi komunitas",
    description:
      "Siap mengelola ruang diskusi dengan standar etika dan menjawab pertanyaan murid secara profesional.",
    required: true,
  },
];

export const mentorProcessSteps: MentorProcessStep[] = [
  {
    step: "01",
    title: "Aplikasi singkat (L1)",
    description:
      "Nama, keahlian, tautan profesional, dan dua pertanyaan pembeda. Tanpa CV atau unggahan.",
    duration: "±4 menit",
  },
  {
    step: "02",
    title: "Screening tim Bursa",
    description:
      "Kami memutuskan apakah mengundang tahap 2, menolak, atau menyimpan di talent pool.",
    duration: "beberapa hari kerja",
  },
  {
    step: "03",
    title: "Aplikasi penuh (L2)",
    description:
      "Portal privat lewat tautan email: bukti, sampel mengajar (URL), usulan kursus, pengungkapan konflik.",
    duration: "15–30 menit",
  },
  {
    step: "04",
    title: "Review & assessment",
    description:
      "Review manusia. Assessment (wawancara/sample) disesuaikan kandidat — bukan formulir otomatis.",
    duration: "bergantung kandidat",
  },
  {
    step: "05",
    title: "Onboarding setelah disetujui",
    description:
      "Persetujuan aplikasi belum membuat profil live. Agreement, identitas, dan produksi menyusul.",
    duration: "setelah approved",
  },
];

export const mentorInstruments: Instrument[] = ["Saham", "Crypto", "Forex"];

export const mentorFaqs = [
  {
    question: "Apakah ada biaya untuk mendaftar sebagai mentor?",
    answer:
      "Tidak ada biaya pendaftaran. Working model (indikatif): komisi platform ~25% dari setiap transaksi kelas yang berhasil, hanya saat kamu mendapatkan murid. Belum dikunci Decision OS.",
  },
  {
    question: "Berapa lama proses verifikasi?",
    answer:
      "Tahap 1 ditinjau dalam beberapa hari kerja. Jika diundang, tahap 2 lewat tautan email. Assessment dan onboarding menyusul hanya jika lolos review.",
  },
  {
    question: "Apakah saya harus unggah CV saat daftar?",
    answer:
      "Tidak di tahap 1. CV dan sampel mengajar berupa tautan privat diminta di tahap 2, setelah screening.",
  },
  {
    question: "Apakah saya harus punya kelas siap saat mendaftar?",
    answer:
      "Tidak wajib, tetapi konten sampel (video pengenalan, webinar, artikel) mempercepat proses review. Kamu bisa menyusun kelas perdana selama onboarding.",
  },
  {
    question: "Instrumen apa saja yang didukung?",
    answer:
      "Tahap 1 memakai taksonomi keahlian (saham, forex, kripto, makro, kuantitatif, dll.). Katalog live saat ini tetap berfokus Saham, Crypto, dan Forex.",
  },
];
