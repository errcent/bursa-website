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
      "Bursa fokus pada edukasi terstruktur dengan mentor terverifikasi — bukan konten random atau sinyal tanpa konteks. Setiap kelas punya video berurutan, progress tracking, dan ruang komunitas per mentor. Kamu bayar per kelas tanpa langganan bulanan, dan platform tidak mengelola dana tradingmu.",
  },
  {
    id: "not-broker",
    question: "Apakah Bursa mengelola uang atau trading saya?",
    answer:
      "Tidak. Bursa adalah platform edukasi, bukan broker atau aplikasi eksekusi trading. Kami tidak menyimpan saldo, tidak mengeksekusi order, dan tidak menjanjikan keuntungan. Semua keputusan investasi dan risiko ada pada kamu.",
  },
  {
    id: "beginners",
    question: "Apakah Bursa cocok untuk pemula yang belum pernah trading?",
    answer:
      "Ya. Banyak kelas berlevel Pemula dengan kurikulum langkah demi langkah — dari dasar instrumen, riset, hingga manajemen risiko. Filter katalog berdasarkan level dan instrumen agar kamu mulai dari materi yang paling relevan.",
  },
  {
    id: "instruments",
    question: "Instrumen apa saja yang diajarkan di Bursa?",
    answer:
      "Saat ini kami mendukung tiga instrumen utama: Saham, Crypto, dan Forex. Setiap instrumen punya kelas dari level pemula hingga menengah, dengan mentor yang spesialis di bidangnya. Kamu bisa fokus satu instrumen atau belajar lintas pasar.",
  },
  {
    id: "community",
    question: "Apakah ada komunitas atau chat langsung dengan mentor?",
    answer:
      "Ya. Setiap mentor bisa membuka ruang komunitas — gratis atau berlangganan — untuk diskusi, Q&A, dan update materi. Akses chat tersedia setelah kamu membeli kelas atau bergabung ke ruang yang ditentukan mentor.",
  },
  {
    id: "pricing-model",
    question: "Apakah harus berlangganan bulanan untuk belajar di Bursa?",
    answer:
      "Tidak. Model Bursa adalah bayar per kelas — kamu hanya membayar kelas yang dipilih, tanpa biaya langganan platform. Beberapa ruang komunitas mentor mungkin berlangganan terpisah, dan detailnya selalu ditampilkan sebelum kamu bergabung.",
  },
];
