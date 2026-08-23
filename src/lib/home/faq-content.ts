export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
}

export const homeFaqs: HomeFaq[] = [
  {
    id: "uniqueness",
    question: "Apa yang membuat Bursa berbeda dari platform edukasi trading lain?",
    answer:
      "Edukasi terstruktur dengan mentor yang melalui proses kurasi, bukan konten acak atau sinyal tanpa konteks. Setiap kelas dibayar per tahun. Bukan langganan bulanan.",
  },
  {
    id: "not-broker",
    question: "Apakah Bursa mengelola uang atau trading saya?",
    answer:
      "Tidak. Bursa adalah platform edukasi, bukan broker. Kami tidak menyimpan saldo, tidak mengeksekusi order, dan tidak menjanjikan keuntungan.",
  },
  {
    id: "beginners",
    question: "Apakah Bursa cocok untuk pemula yang belum pernah trading?",
    answer:
      "Ya. Banyak kelas berlevel Pemula dengan kurikulum langkah demi langkah. Filter katalog berdasarkan level dan instrumen.",
  },
  {
    id: "instruments",
    question: "Instrumen apa saja yang diajarkan di Bursa?",
    answer:
      "Saham, Crypto, dan Forex. Setiap instrumen punya kelas dari pemula hingga menengah dengan mentor spesialis.",
  },
  {
    id: "find-class",
    question: "Bagaimana cara menemukan kelas yang cocok?",
    answer:
      "Ada Panduan Belajar. Beberapa pertanyaan singkat, semacam kuis. Setelah itu kamu langsung melihat kelas yang sesuai.",
  },
  {
    id: "pricing-model",
    question: "Apakah harus berlangganan bulanan untuk belajar di Bursa?",
    answer:
      "Tidak. Pembayaran berlaku per kelas, per tahun. Bukan langganan bulanan untuk seluruh platform.",
  },
];
