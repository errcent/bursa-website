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
      "Edukasi terstruktur dengan mentor terverifikasi, bukan konten random atau sinyal tanpa konteks. Bayar per kelas, tanpa langganan bulanan.",
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
    id: "community",
    question: "Apakah ada komunitas atau chat langsung dengan mentor?",
    answer:
      "Ya. Setiap mentor bisa membuka ruang komunitas untuk diskusi dan Q&A. Akses chat tersedia setelah peluncuran penuh.",
  },
  {
    id: "pricing-model",
    question: "Apakah harus berlangganan bulanan untuk belajar di Bursa?",
    answer:
      "Tidak. Model bayar per kelas, tanpa langganan platform. Detail harga akan diumumkan saat peluncuran resmi.",
  },
];
