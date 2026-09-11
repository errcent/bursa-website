export type HelpCategory = "Platform" | "Akun" | "Pembayaran" | "Belajar" | "Note" | "Komunitas" | "Mentor";

export interface HelpFaq {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
}

export const helpCategories: HelpCategory[] = [
  "Platform",
  "Akun",
  "Pembayaran",
  "Belajar",
  "Note",
  "Komunitas",
  "Mentor",
];

export const helpFaqs: HelpFaq[] = [
  {
    id: "platform-badan-hukum",
    category: "Platform",
    question: "Siapa yang mengoperasikan Bursa?",
    answer:
      "PT Global Makmur Madani menaungi merek Bursa / Bursanalar. Pengurusan kegiatan usaha Bursanalar dijalankan oleh Raden Mohammad Kaisar Khan dan Fakhri Muzakki. Bursa bukan PUJK, broker, atau penasihat investasi.",
  },
  {
    id: "akun-daftar",
    category: "Akun",
    question: "Bagaimana cara mendaftar akun Bursa?",
    answer:
      "Pendaftaran publik belum dibuka. Gabung waitlist di /waitlist untuk early access. Kamu tetap bisa melihat katalog, preview, dan Panduan Belajar tanpa akun.",
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
      "Hapus akun dari aplikasi belum tersedia. Kirim permintaan ke privacy@bursanalar.com untuk hak akses atau penghapusan data.",
  },
  {
    id: "bayar-metode",
    category: "Pembayaran",
    question: "Metode pembayaran apa saja yang tersedia?",
    answer:
      "Pembayaran publik belum dibuka. Setelah masuk, kamu dapat mengakses seluruh katalog tanpa checkout.",
  },
  {
    id: "bayar-refund",
    category: "Pembayaran",
    question: "Apakah akses kelas bisa di-refund?",
    answer:
      "Pembayaran belum dibuka. Jika ada masalah teknis yang membuat kelas tidak bisa diakses, hubungi support@bursanalar.com.",
  },
  {
    id: "bayar-invoice",
    category: "Pembayaran",
    question: "Di mana saya bisa unduh invoice?",
    answer:
      "Riwayat transaksi (jika ada) tersedia di Pengaturan. Invoice digital akan tersedia setelah pembayaran dibuka.",
  },
  {
    id: "belajar-akses",
    category: "Belajar",
    question: "Berapa lama akses kelas setelah masuk?",
    answer:
      "Selama akun aktif, kamu dapat mengakses seluruh katalog yang dipublikasikan, termasuk pembaruan materi dari mentor.",
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
    id: "belajar-investasi",
    category: "Belajar",
    question: "Apakah Bursa hanya untuk trader, atau juga untuk investasi jangka panjang?",
    answer:
      "Keduanya. Katalog mencakup trading dan investasi, dari horizon pendek sampai alokasi jangka panjang. Bursa tetap platform edukasi, bukan penasihat investasi.",
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
      "Pendaftaran publik belum dibuka. Jika diundang kurasi, tim Bursa mengirim tautan privat. Bursa mencari praktisi profesional terverifikasi, bukan finfluencer.",
  },
  {
    id: "mentor-komisi",
    category: "Mentor",
    question: "Berapa komisi platform untuk mentor?",
    answer:
      "Skema bayar mentor belum dibuka di publik. Angka komisi yang beredar bersifat indikatif, bukan penawaran hidup.",
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
