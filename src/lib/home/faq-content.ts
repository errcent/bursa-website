export interface HomeFaq {
  id: string;
  question: string;
  answer: string;
}

export const homeFaqs: HomeFaq[] = [
  {
    id: "uniqueness",
    question: "Apa yang membuat Bursa berbeda dari platform edukasi trading dan investasi lain?",
    answer:
      "Kurikulum berjenjang, runut, terkurasi, bersama praktisi profesional terverifikasi. Bukan tumpukan video, bukan sinyal, bukan broker.",
  },
  {
    id: "not-broker",
    question: "Apakah Bursa mengelola uang atau trading saya?",
    answer:
      "Tidak. Bursa adalah platform edukasi, bukan broker. Kami tidak menyimpan saldo, tidak mengeksekusi order, dan tidak menjanjikan keuntungan.",
  },
  {
    id: "legal-entity",
    question: "Siapa yang mengoperasikan Bursa?",
    answer:
      "PT Global Makmur Madani menaungi merek Bursa / Bursanalar. Pengurusan kegiatan usaha Bursanalar dijalankan oleh Raden Mohammad Kaisar Khan dan Fakhri Muzakki.",
  },
  {
    id: "beginners",
    question: "Apakah Bursa cocok untuk pemula yang belum pernah trading vs. investing?",
    answer:
      "Ya. Banyak kelas berlevel Pemula. Katalog mencakup trading dan investasi, dari horizon pendek sampai alokasi jangka panjang. Filter berdasarkan level dan instrumen supaya kamu menemukan kelas yang cocok.",
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
    question: "Bagaimana cara mengakses seluruh kelas di Bursa?",
    answer:
      "Setelah masuk, kamu mendapat akses ke seluruh katalog. Satu akun, semua kelas. Pembayaran belum dibuka.",
  },
];
