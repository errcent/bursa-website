import type { LearningGuidanceAnswers } from "@/lib/learning/guidance/types";
import type { Instrument } from "@/lib/types";

export type GuidanceQuestionId = keyof LearningGuidanceAnswers;

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

export const GUIDANCE_QUESTIONS: GuidanceQuestion[] = [
  {
    id: "instrument",
    title: "Instrumen apa yang ingin kamu fokuskan?",
    subtitle:
      "Pilih pasar yang paling relevan dengan tujuanmu. Kamu bisa eksplorasi instrumen lain nanti.",
    options: [
      {
        value: "Saham",
        label: "Saham Indonesia",
        description: "IDX, analisis fundamental & teknikal emiten lokal.",
      },
      {
        value: "Crypto",
        label: "Aset Kripto",
        description: "Bitcoin, altcoin, dan dinamika pasar 24/7.",
      },
      {
        value: "Forex",
        label: "Forex",
        description: "Pasangan mata uang global dengan leverage tinggi.",
      },
    ] satisfies GuidanceOption<Instrument>[],
  },
  {
    id: "experience",
    title: "Sejauh mana pengalaman tradingmu?",
    subtitle: "Jujur di sini — kami akan mulai dari level yang tepat, bukan yang terlalu cepat.",
    options: [
      {
        value: "never",
        label: "Belum pernah trading",
        description: "Baru dengar istilah candlestick & order.",
      },
      {
        value: "demo",
        label: "Sudah coba akun demo",
        description: "Pernah buka chart tapi belum pakai uang riil.",
      },
      {
        value: "regular",
        label: "Sudah trading rutin",
        description: "Punya strategi dasar, masih mencari konsistensi.",
      },
      {
        value: "profitable",
        label: "Sudah profitable konsisten",
        description: "Butuh pendalaman & optimasi lanjutan.",
      },
    ],
  },
  {
    id: "tradingStyle",
    title: "Gaya trading apa yang paling cocok untukmu?",
    subtitle: "Ini membantu kami merekomendasikan durasi kelas dan mentor yang sesuai ritmemu.",
    options: [
      {
        value: "scalping",
        label: "Scalping",
        description: "Entry cepat — menit hingga beberapa jam.",
      },
      {
        value: "day_trading",
        label: "Day trading",
        description: "Posisi dibuka-tutup dalam hari yang sama — beberapa jam hingga satu hari.",
      },
      {
        value: "swing",
        label: "Swing trading",
        description: "Posisi beberapa hari hingga minggu.",
      },
      {
        value: "long_term",
        label: "Investasi jangka panjang",
        description: "Hold berminggu-minggu hingga bulan.",
      },
    ],
  },
  {
    id: "goal",
    title: "Apa tujuan utama belajarmu?",
    subtitle: "Tujuan yang jelas membantu memilih mentor yang fokus pada outcome yang kamu inginkan.",
    options: [
      {
        value: "basics",
        label: "Pahami dasar dulu",
        description: "Bangun fondasi sebelum pakai modal besar.",
      },
      {
        value: "side_income",
        label: "Penghasilan tambahan",
        description: "Trading sebagai sampingan di sela pekerjaan.",
      },
      {
        value: "wealth",
        label: "Bangun kekayaan",
        description: "Akumulasi aset jangka menengah-panjang.",
      },
      {
        value: "retirement",
        label: "Persiapan pensiun",
        description: "Portofolio stabil untuk masa depan.",
      },
    ],
  },
  {
    id: "riskTolerance",
    title: "Bagaimana toleransi risikomu?",
    subtitle:
      "Di Indonesia, banyak trader baru kehilangan modal karena terlalu agresif. Pilih yang paling jujur.",
    options: [
      {
        value: "conservative",
        label: "Konservatif",
        description: "Prioritas lindungi modal — risiko kecil, target realistis.",
      },
      {
        value: "moderate",
        label: "Seimbang",
        description: "Risiko terukur dengan potensi yang wajar.",
      },
      {
        value: "aggressive",
        label: "Agresif",
        description: "Siap ambil risiko tinggi demi potensi besar.",
      },
    ],
  },
  {
    id: "timeAvailability",
    title: "Berapa waktu yang bisa kamu luangkan per minggu?",
    subtitle: "Kami akan menyesuaikan rekomendasi kelas berdasarkan komitmen waktumu.",
    options: [
      {
        value: "minimal",
        label: "Kurang dari 3 jam",
        description: "Belajar ringan di sela aktivitas.",
      },
      {
        value: "part_time",
        label: "3–7 jam",
        description: "Rutinitas belajar terjadwal.",
      },
      {
        value: "dedicated",
        label: "Lebih dari 7 jam",
        description: "Fokus serius — siap deep dive.",
      },
    ],
  },
  {
    id: "capitalRange",
    title: "Kisaran modal yang siap kamu alokasikan? (opsional)",
    subtitle:
      "Opsional — jika diisi, kami sesuaikan level kelas dan ekspektasi risiko. Bisa dilewati kapan saja.",
    optional: true,
    options: [
      {
        value: "under_5m",
        label: "Di bawah Rp 5 juta",
        description: "Mulai kecil — fokus belajar dulu.",
      },
      {
        value: "5_20m",
        label: "Rp 5–20 juta",
        description: "Modal pemula yang umum di Indonesia.",
      },
      {
        value: "20_50m",
        label: "Rp 20–50 juta",
        description: "Modal menengah dengan ruang eksperimen.",
      },
      {
        value: "above_50m",
        label: "Di atas Rp 50 juta",
        description: "Modal signifikan — butuh disiplin risiko ketat.",
      },
      {
        value: "prefer_not_say",
        label: "Lebih baik tidak menyebutkan",
        description: "Lewati pertanyaan ini.",
      },
    ],
  },
];
