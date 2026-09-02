export type HelpCategory = "Akun" | "Pembayaran" | "Belajar" | "Note" | "Komunitas" | "Mentor";

export interface HelpFaq {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
}

export const helpCategories: HelpCategory[] = [
  "Akun",
  "Pembayaran",
  "Belajar",
  "Note",
  "Komunitas",
  "Mentor",
];

export const helpFaqs: HelpFaq[] = [
  {
    id: "akun-daftar",
    category: "Akun",
    question: "Bagaimana cara mendaftar akun Bursa?",
    answer:
      "Klik Daftar di navbar, isi nama, email, dan kata sandi. Setelah verifikasi email, kamu bisa mengakses katalog kelas, dashboard, dan komunitas sesuai langganan.",
  },
  {
    id: "akun-lupa-password",
    category: "Akun",
    question: "Saya lupa kata sandi. Apa yang harus dilakukan?",
    answer:
      "Di halaman Masuk, klik Lupa kata sandi dan masukkan email terdaftar. Kami kirim tautan reset yang berlaku 24 jam. Jika email tidak masuk, cek folder spam atau hubungi support@bursanalar.com.",
  },
  {
    id: "akun-hapus",
    category: "Akun",
    question: "Bisakah saya menghapus akun secara permanen?",
    answer:
      "Ya. Buka Pengaturan → Akun → Hapus akun. Proses irreversible, progress kelas dan riwayat transaksi akan dihapus sesuai kebijakan retensi data. Akses kelas yang sudah dibeli tidak dapat dipulihkan.",
  },
  {
    id: "bayar-metode",
    category: "Pembayaran",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer:
      "Kami mendukung transfer bank, e-wallet (GoPay, OVO, DANA), dan kartu kredit/debit melalui payment gateway terintegrasi. Metode yang tampil bisa berbeda per kelas dan mentor.",
  },
  {
    id: "bayar-refund",
    category: "Pembayaran",
    question: "Apakah pembelian kelas bisa di-refund?",
    answer:
      "Pembelian kelas bersifat final. Sebelum checkout, baca deskripsi kelas, preview video gratis, dan ulasan murid. Jika ada masalah teknis (akses tidak aktif setelah pembayaran), hubungi support dengan bukti transaksi.",
  },
  {
    id: "bayar-invoice",
    category: "Pembayaran",
    question: "Di mana saya bisa unduh invoice?",
    answer:
      "Invoice tersedia di Dashboard → Riwayat pembelian. Klik transaksi yang selesai, lalu unduh PDF. Invoice mencantumkan nama kelas, mentor, tanggal, dan nominal.",
  },
  {
    id: "belajar-akses",
    category: "Belajar",
    question: "Berapa lama akses kelas setelah pembelian?",
    answer:
      "Kebanyakan kelas memberikan lifetime access sejak tanggal pembelian, termasuk update materi dari mentor. Detail spesifik tercantum di halaman kelas sebelum checkout.",
  },
  {
    id: "belajar-progress",
    category: "Belajar",
    question: "Apakah progress belajar tersimpan antar perangkat?",
    answer:
      "Progress belajar dan catatan lesson (Notes) tersinkron via akun Bursa · masuk dengan akun yang sama di desktop atau mobile untuk melanjutkan dari posisi terakhir. Simpanan kelas/video (bookmark) saat ini tersimpan di perangkat browser atau aplikasi; sinkron antar perangkat untuk bookmark sedang dalam rencana. Jurnal eksekusi (Bursa Note) terpisah dari catatan lesson.",
  },
  {
    id: "belajar-sertifikat",
    category: "Belajar",
    question: "Apakah ada sertifikat setelah menyelesaikan kelas?",
    answer:
      "Beberapa kelas menyediakan sertifikat penyelesaian setelah semua video selesai. Badge sertifikat tampil di profil jika mentor mengaktifkan fitur tersebut untuk kelasnya.",
  },
  {
    id: "note-apa",
    category: "Note",
    question: "Apa bedanya Notes pelajaran dengan Bursa Note?",
    answer:
      "Notes adalah catatan timestamp di dalam video kelas. Bursa Note (note.bursanalar.com) adalah jurnal privat untuk mencatat trade & invest: PnL, posisi, dan refleksi. Keduanya tidak saling menimpa.",
  },
  {
    id: "note-privasi",
    category: "Note",
    question: "Apakah mentor atau admin bisa membaca jurnal saya?",
    answer:
      "Tidak. Jurnal default privat. Mentor dan admin tidak punya akses. Berbagi entri hanya terjadi jika kamu membuat tautan berbagi yang bisa dicabut.",
  },
  {
    id: "komunitas-join",
    category: "Komunitas",
    question: "Bagaimana cara bergabung ke ruang komunitas?",
    answer:
      "Ruang komunitas bisa gratis atau berlangganan, tergantung mentor. Buka halaman Komunitas, pilih ruang, lalu klik Gabung. Ruang berbayar memerlukan langganan aktif sebelum akses chat dan sinyal.",
  },
  {
    id: "komunitas-aturan",
    category: "Komunitas",
    question: "Apa aturan utama di ruang komunitas?",
    answer:
      "Dilarang promosi scam, share sinyal tanpa konteks risiko, spam, dan pelecehan. Mentor dan mod berhak mute atau remove member yang melanggar. Detail lengkap ada di panduan ruang masing-masing.",
  },
  {
    id: "mentor-daftar",
    category: "Mentor",
    question: "Bagaimana cara mendaftar sebagai mentor?",
    answer:
      "Kunjungi halaman Jadi Mentor, baca persyaratan, lalu isi formulir pendaftaran. Tim kurasi meninjau dalam 3–5 hari kerja. Setelah lolos kurasi, profil bisa mempublikasikan kelas dan ruang komunitas.",
  },
  {
    id: "mentor-komisi",
    category: "Mentor",
    question: "Berapa komisi platform untuk mentor?",
    answer:
      "Working model (indikatif): komisi platform ~25% dari setiap transaksi kelas. Sisanya masuk ke payout mentor sesuai jadwal di dashboard. Rincian final tampil sebelum murid konfirmasi pembayaran.",
  },
  {
    id: "mentor-konten",
    category: "Mentor",
    question: "Apakah materi kelas perlu disetujui tim Bursa?",
    answer:
      "Ya. Semua kelas baru melalui review kurasi sebelum publikasi, untuk memastikan kualitas edukasi, kepatuhan regulasi, dan tidak ada janji keuntungan pasti.",
  },
];

export function getFaqsByCategory(category: HelpCategory): HelpFaq[] {
  return helpFaqs.filter((f) => f.category === category);
}

export function searchHelpFaqs(query: string): HelpFaq[] {
  const q = query.trim().toLowerCase();
  if (!q) return helpFaqs;
  return helpFaqs.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
  );
}
