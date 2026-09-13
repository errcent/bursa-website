import { legalEntityCopy } from "@/lib/legal/entity";
import { PREVIEW_CATALOG_COPY } from "@/lib/preview-catalog/copy";

export type HelpCategory = "Platform" | "Akun" | "Belajar" | "Note" | "Mentor";

export interface HelpFaq {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
}

export const helpCategories: HelpCategory[] = ["Platform", "Akun", "Belajar", "Note", "Mentor"];

export const helpFaqs: HelpFaq[] = [
  {
    id: "platform-badan-hukum",
    category: "Platform",
    question: legalEntityCopy.id.helpQuestion,
    answer: legalEntityCopy.id.helpAnswer,
  },
  {
    id: "platform-katalog-demo",
    category: "Platform",
    question: "Apakah katalog dan mentor yang tampil sudah data resmi?",
    answer: PREVIEW_CATALOG_COPY.bannerDetail,
  },
  {
    id: "platform-bukan-broker",
    category: "Platform",
    question: "Apakah Bursa mengelola uang atau trading saya?",
    answer:
      "Tidak. Bursa adalah platform edukasi, bukan broker atau penasihat investasi. Kami tidak menyimpan saldo, tidak mengeksekusi order, dan tidak mengelola portofolio kamu.",
  },
  {
    id: "akun-daftar",
    category: "Akun",
    question: "Bagaimana cara mendaftar akun Bursa?",
    answer:
      "Pendaftaran publik belum dibuka. Gabung waitlist di /waitlist untuk early access. Kamu tetap bisa melihat katalog demonstrasi, preview, dan Panduan Belajar tanpa akun.",
  },
  {
    id: "akun-hapus",
    category: "Akun",
    question: "Bisakah saya menghapus akun secara permanen?",
    answer:
      "Hapus akun dari aplikasi belum tersedia. Kirim permintaan ke privacy@bursanalar.com untuk hak akses atau penghapusan data.",
  },
  {
    id: "belajar-akses",
    category: "Belajar",
    question: "Berapa lama akses kelas setelah masuk?",
    answer:
      "Saat ini situs dalam fase demonstrasi: preview dan katalog contoh bisa dijelajahi tanpa akun. Setelah pendaftaran publik dibuka, rencananya akses ke katalog yang dipublikasikan berlaku selama akun aktif, termasuk pembaruan materi dari mentor.",
  },
  {
    id: "belajar-progress",
    category: "Belajar",
    question: "Apakah progress belajar tersimpan antar perangkat?",
    answer:
      "Di fase demonstrasi, progress penuh memerlukan akun; fitur masuk belum dibuka untuk publik. Setelah launch, progress belajar dan catatan lesson (Notes) direncanakan tersinkron via akun Bursa di desktop atau mobile. Jurnal eksekusi (Bursa Note) terpisah dari catatan lesson.",
  },
  {
    id: "belajar-sertifikat",
    category: "Belajar",
    question: "Apakah ada sertifikat setelah menyelesaikan kelas?",
    answer:
      "Fitur sertifikat penyelesaian direncanakan untuk sebagian kelas setelah peluncuran penuh. Di katalog demonstrasi, badge sertifikat (jika tampil) hanya contoh antarmuka.",
  },
  {
    id: "belajar-investasi",
    category: "Belajar",
    question: "Apakah Bursa hanya untuk trader, atau juga untuk investasi jangka panjang?",
    answer:
      "Keduanya. Kurikulum mencakup trading dan investasi, dari horizon pendek sampai alokasi jangka panjang. Bursa tetap platform edukasi, bukan penasihat investasi.",
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
