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
      "Murid membayar per kelas langsung ke akun mentor. Platform mengambil komisi 25% — sisanya (75%) menjadi milikmu.",
  },
  {
    icon: "users",
    title: "Audiens siap belajar",
    description:
      "Akses ke komunitas pelajar aktif yang mencari edukasi trading terstruktur, bukan konten random.",
  },
  {
    icon: "shield",
    title: "Verifikasi & kepercayaan",
    description:
      "Badge mentor terverifikasi meningkatkan kredibilitas. Tim kami meninjau materi sebelum publikasi.",
  },
  {
    icon: "video",
    title: "Infrastruktur kelas lengkap",
    description:
      "Upload video, modul terstruktur, progress tracking, dan ruang komunitas — tanpa bangun platform sendiri.",
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
    title: "Ajukan aplikasi",
    description:
      "Isi formulir pendaftaran dengan profil profesional, spesialisasi instrumen, dan portofolio mengajar.",
    duration: "±15 menit",
  },
  {
    step: "02",
    title: "Review tim Bursa",
    description:
      "Tim kurasi meninjau kredensial, sampel konten, dan kesesuaian dengan standar edukasi platform.",
    duration: "3–5 hari kerja",
  },
  {
    step: "03",
    title: "Wawancara & verifikasi",
    description:
      "Sesi singkat untuk memahami gaya mengajar, filosofi trading, dan rencana kurikulum kelas pertama.",
    duration: "30–45 menit",
  },
  {
    step: "04",
    title: "Onboarding mentor",
    description:
      "Setup profil, upload materi kelas perdana, dan pelatihan penggunaan dashboard serta komunitas.",
    duration: "1–2 minggu",
  },
  {
    step: "05",
    title: "Go live",
    description:
      "Profil dan kelas dipublikasikan di katalog. Kamu mulai menerima murid dan pendapatan.",
    duration: "Setelah materi disetujui",
  },
];

export const mentorInstruments: Instrument[] = ["Saham", "Crypto", "Forex"];

export const mentorFaqs = [
  {
    question: "Apakah ada biaya untuk mendaftar sebagai mentor?",
    answer:
      "Tidak ada biaya pendaftaran. Platform mengambil komisi 25% dari setiap transaksi kelas yang berhasil — hanya saat kamu mendapatkan murid.",
  },
  {
    question: "Berapa lama proses verifikasi?",
    answer:
      "Rata-rata 1–2 minggu dari pengajuan hingga profil aktif, tergantung kelengkapan dokumen dan jadwal wawancara.",
  },
  {
    question: "Apakah saya harus punya kelas siap saat mendaftar?",
    answer:
      "Tidak wajib, tetapi konten sampel (video pengenalan, webinar, artikel) mempercepat proses review. Kamu bisa menyusun kelas perdana selama onboarding.",
  },
  {
    question: "Instrumen apa saja yang didukung?",
    answer:
      "Saat ini kami menerima mentor untuk Saham, Crypto, dan Forex. Pilih satu atau lebih sesuai keahlianmu.",
  },
];
