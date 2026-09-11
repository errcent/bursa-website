import type { GuidanceQuizQuestionId, LearningGuidanceAnswers } from "@/lib/learning/guidance/types";
import type { Instrument } from "@/lib/types";

export type GuidanceQuestionId = GuidanceQuizQuestionId;

export interface GuidanceOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface GuidanceQuestion {
  id: GuidanceQuestionId;
  title: string;
  subtitle: string;
  optional?: boolean;
  options: GuidanceOption[];
}

/**
 * Psych flow: anchor → experience → motivation → loss scenario → monitor horizon
 * → time budget → primary gap (always answered).
 */
export const GUIDANCE_QUESTIONS: GuidanceQuestion[] = [
  {
    id: "instrument",
    title: "Instrumen apa yang ingin kamu fokuskan?",
    subtitle: "Rekomendasi di akhir quiz akan difilter ke pasar ini dulu.",
    options: [
      {
        value: "Saham",
        label: "Saham Indonesia",
        description: "BEI: fundamental, teknikal, dan dividen emiten lokal.",
      },
      {
        value: "Crypto",
        label: "Aset kripto",
        description: "Bitcoin, altcoin, pasar 24/7 dengan volatilitas tinggi.",
      },
      {
        value: "Forex",
        label: "Forex",
        description: "Pasangan mata uang global; butuh disiplin risiko ketat.",
      },
    ] satisfies GuidanceOption<Instrument>[],
  },
  {
    id: "experience",
    title: "Sejauh mana kamu sudah terlibat di pasar?",
    subtitle: "Tidak ada jawaban benar. Yang penting level materi pas, tidak terlalu cepat.",
    options: [
      {
        value: "never",
        label: "Baru mulai, belum pernah transaksi",
        description: "Masih memahami istilah dasar seperti order dan candlestick.",
      },
      {
        value: "demo",
        label: "Sudah coba akun demo / paper trading",
        description: "Pernah buka chart, belum rutin pakai uang riil.",
      },
      {
        value: "regular",
        label: "Sudah transaksi rutin",
        description: "Punya pendekatan dasar, masih mencari konsistensi.",
      },
      {
        value: "profitable",
        label: "Sudah punya proses yang berjalan",
        description: "Butuh evaluasi lanjutan atau spesialisasi lebih dalam.",
      },
    ],
  },
  {
    id: "goal",
    title: "Apa yang paling ingin kamu capai dari belajar?",
    subtitle: "Satu fokus utama. Kami prioritaskan kelas yang mendukung outcome ini.",
    options: [
      {
        value: "basics",
        label: "Paham cara kerja pasar dulu",
        description: "Fondasi sebelum modal besar atau strategi rumit.",
      },
      {
        value: "side_income",
        label: "Belajar tanpa mengganggu pekerjaan utama",
        description: "Materi praktis yang muat di sela waktu.",
      },
      {
        value: "wealth",
        label: "Bangun aset jangka menengah-panjang",
        description: "Akumulasi terukur, bukan cari cuan cepat.",
      },
      {
        value: "retirement",
        label: "Siapkan portofolio untuk masa depan",
        description: "Pendekatan stabil dan berkelanjutan.",
      },
    ],
  },
  {
    id: "riskTolerance",
    title: "Bayangkan posisimu turun sekitar 10% minggu ini. Apa reaksimu?",
    subtitle: "Pilih yang paling jujur. Ini membantu selaraskan intensitas materi, bukan menilai kamu.",
    options: [
      {
        value: "conservative",
        label: "Review rencana, kurangi exposure atau pause dulu",
        description: "Prioritas lindungi modal; tidak lanjut asal-asalan.",
      },
      {
        value: "moderate",
        label: "Tahan jika alasan entry masih valid",
        description: "Risiko terukur, tidak panik tapi juga tidak acuh.",
      },
      {
        value: "aggressive",
        label: "Cari peluang tambah / re-entry dengan aturan jelas",
        description: "Nyaman volatilitas, asal ada risk management.",
      },
    ],
  },
  {
    id: "tradingStyle",
    title: "Seberapa sering kamu realistis bisa pantau pasar?",
    subtitle: "Bukan gaya ideal, melainkan yang kamu sanggup jalankan minggu ini.",
    options: [
      {
        value: "scalping",
        label: "Hampir tiap jam saat sesi buka",
        description: "Butuh materi ringkas & eksekusi cepat (menit-jam).",
      },
      {
        value: "day_trading",
        label: "Beberapa kali sehari",
        description: "Posisi dibuka-tutup dalam hari yang sama.",
      },
      {
        value: "swing",
        label: "Beberapa kali seminggu",
        description: "Hold beberapa hari sampai minggu; tidak perlu pantau terus.",
      },
      {
        value: "long_term",
        label: "Sesekali, fokus horizon bulanan",
        description: "Analisis mendalam, jarang eksekusi.",
      },
    ],
  },
  {
    id: "timeAvailability",
    title: "Berapa jam per minggu yang bisa kamu sisihkan untuk belajar?",
    subtitle: "Termasuk menonton video, catatan, dan latihan, bukan hanya buka chart.",
    options: [
      {
        value: "minimal",
        label: "Kurang dari 3 jam",
        description: "Belajar ringkas di sela rutinitas.",
      },
      {
        value: "part_time",
        label: "3-7 jam",
        description: "Jadwal belajar terencana.",
      },
      {
        value: "dedicated",
        label: "Lebih dari 7 jam",
        description: "Siap program yang lebih panjang dan mendalam.",
      },
    ],
  },
  {
    id: "learningGap",
    title: "Apa hambatan terbesarmu saat ini?",
    subtitle: "Jawaban ini paling memengaruhi kelas dan playlist pertama yang kami pilih.",
    options: [
      {
        value: "no_foundation",
        label: "Belum punya fondasi, bingung mulai dari mana",
        description: "Butuh peta belajar dari nol.",
      },
      {
        value: "emotional_control",
        label: "Emosi/FOMO sering mengganggu keputusan",
        description: "Butuh disiplin & mindset sebelum strategi baru.",
      },
      {
        value: "inconsistent_execution",
        label: "Sudah paham teori, eksekusi belum konsisten",
        description: "Butuh struktur latihan & checklist praktis.",
      },
      {
        value: "ready_for_depth",
        label: "Siap naik level: analisis & strategi lebih dalam",
        description: "Fondasi ada, cari pendalaman.",
      },
    ] satisfies GuidanceOption<LearningGuidanceAnswers["learningGap"]>[],
  },
];
