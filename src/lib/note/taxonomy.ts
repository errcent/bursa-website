export interface ClinicQuestion {
  id: string;
  prompt: string;
}

export interface ClinicModule {
  id: string;
  name: string;
  summary: string;
  kindHint: "TRADE" | "INVEST" | "BOTH";
  /** Reserved for a later Plus wave. All modules are free in the habit phase. */
  plusOnly: boolean;
  protocol: string;
  questions: ClinicQuestion[];
  why: string;
}

export const FREE_CLINIC_MODULE_ID = "setelah-rugi";

export const CLINIC_MODULES: ClinicModule[] = [
  {
    id: FREE_CLINIC_MODULE_ID,
    name: "Setelah rugi",
    summary: "Cegah revenge dan 'harus balik modal' sesaat setelah loss.",
    kindHint: "BOTH",
    plusOnly: false,
    protocol: "Berhenti satu sesi. Tulis aturan yang dilanggar. Entry berikutnya hanya jika aturan itu utuh.",
    questions: [
      { id: "q1", prompt: "Apa yang kamu rasakan 5 menit setelah loss ini?" },
      { id: "q2", prompt: "Apakah kamu ingin langsung buka posisi lagi untuk 'balik modal'?" },
      { id: "q3", prompt: "Aturan mana yang sudah kamu tulis sebelum entry ini?" },
      { id: "q4", prompt: "Kalau temanmu yang rugi sama, nasihat apa yang kamu kasih?" },
    ],
    why: "Loss aversion (Kahneman) + keputusan emosional (Gupta 2025).",
  },
  {
    id: "menahan-rugi",
    name: "Menahan yang merugi",
    summary: "Menutup yang untung terlalu cepat, menahan yang rugi terlalu lama.",
    kindHint: "BOTH",
    plusOnly: false,
    protocol: "Bandingkan thesis vs harga beli. Jika thesis rusak, tutup. Harga beli bukan alasan hold.",
    questions: [
      { id: "q1", prompt: "Kalau kamu belum punya posisi ini, apakah kamu membelinya hari ini?" },
      { id: "q2", prompt: "Yang menahanmu: thesis masih valid, atau malu realisasi rugi?" },
      { id: "q3", prompt: "Pemenang mana yang kamu jual lebih cepat dari rencana?" },
      { id: "q4", prompt: "Apa kriteria objektif untuk keluar yang sudah kamu tulis sebelumnya?" },
    ],
    why: "Disposition effect (Shefrin–Statman) + mental accounting (Kahneman ch.32).",
  },
  {
    id: "sering-cek",
    name: "Terlalu sering cek",
    summary: "Cek portofolio/chart berulang membuat rugi terasa lebih sering.",
    kindHint: "INVEST",
    plusOnly: false,
    protocol: "Jadwalkan 1 jendela cek per hari (trade) atau per minggu (invest). Matikan push harga di luar itu.",
    questions: [
      { id: "q1", prompt: "Berapa kali kamu membuka chart atau porto hari ini?" },
      { id: "q2", prompt: "Horizon resmi posisimu berapa lama?" },
      { id: "q3", prompt: "Cek terakhir mengubah keputusan atau hanya menaikkan cemas?" },
      { id: "q4", prompt: "Apa yang terjadi jika kamu tidak cek sampai jadwal berikutnya?" },
    ],
    why: "Myopic loss aversion (Benartzi–Thaler).",
  },
  {
    id: "overtrade",
    name: "Overtrade / merasa jago",
    summary: "Menang kecil lalu volume dan frekuensi naik tanpa edge baru.",
    kindHint: "TRADE",
    plusOnly: false,
    protocol: "Cap jumlah trade hari ini. Naikkan size hanya setelah 20 entry sesuai aturan, bukan setelah 2 win.",
    questions: [
      { id: "q1", prompt: "Berapa trade yang sudah kamu ambil hari ini vs rencana?" },
      { id: "q2", prompt: "Win terakhir membuatmu merasa lebih pintar dari setup-nya?" },
      { id: "q3", prompt: "Tanpa trade ini, apakah harimu tetap sesuai rencana?" },
      { id: "q4", prompt: "Apa bukti edge-mu selain perasaan?" },
    ],
    why: "Illusion of skill (Kahneman; Barber–Odean).",
  },
  {
    id: "ikut-ramai",
    name: "Ikut keramaian",
    summary: "Entry karena thread, grup, atau takut ketinggalan.",
    kindHint: "BOTH",
    plusOnly: false,
    protocol: "Tunda 24 jam (invest) atau 1 sesi (trade). Entry hanya jika checklist pribadi lulus tanpa sumber sosial.",
    questions: [
      { id: "q1", prompt: "Sumber ide ini: riset sendiri atau orang lain?" },
      { id: "q2", prompt: "Kalau tidak ada yang membicarakan ini, tetap masuk?" },
      { id: "q3", prompt: "Apa yang kamu takut lewatkan secara konkret?" },
      { id: "q4", prompt: "Risiko maksimal yang sudah kamu tulis sebelum lihat keramaian?" },
    ],
    why: "Herding / FOMO (Statman; Gupta).",
  },
  {
    id: "ukuran-posisi",
    name: "Ukuran posisi",
    summary: "Size tidak sesuai risiko per trade / alokasi.",
    kindHint: "BOTH",
    plusOnly: false,
    protocol: "Hitung ulang size dari risiko % akun, bukan dari keyakinan. Jika ragu, potong size jadi setengah.",
    questions: [
      { id: "q1", prompt: "Berapa % akun yang kamu risikokan di entry ini?" },
      { id: "q2", prompt: "Angka itu sesuai aturan tertulismu?" },
      { id: "q3", prompt: "Apakah size membesar karena 'setup yakin'?" },
      { id: "q4", prompt: "Kalau loss penuh, tidurmu tetap tenang?" },
    ],
    why: "Money management (Unger).",
  },
  {
    id: "tesis-bergeser",
    name: "Tesis berubah diam-diam",
    summary: "Alasan hold berganti setelah harga bergerak, tanpa review sadar.",
    kindHint: "INVEST",
    plusOnly: false,
    protocol: "Tulis thesis 3 kalimat di hari beli. Review hanya terhadap teks itu. Jika beda, itu exit signal.",
    questions: [
      { id: "q1", prompt: "Thesis asli saat beli — masih sama kata-katanya?" },
      { id: "q2", prompt: "Alasan hold hari ini: data baru atau harga sudah masuk?" },
      { id: "q3", prompt: "Apa yang akan membuatmu salah (pre-mortem)?" },
      { id: "q4", prompt: "Sudah berapa kali thesis ini kamu rewrite diam-diam?" },
    ],
    why: "Thesis drift; outside view (Kahneman).",
  },
  {
    id: "banjir-info",
    name: "Banjir informasi",
    summary: "Terlalu banyak indikator, channel, dan opini — keputusan jadi kabur.",
    kindHint: "BOTH",
    plusOnly: false,
    protocol: "Pakai maksimal 3 sumber. Hapus 1 indikator atau 1 channel minggu ini. Jangan menambah.",
    questions: [
      { id: "q1", prompt: "Berapa sumber yang kamu buka sebelum entry ini?" },
      { id: "q2", prompt: "Sumber mana yang benar-benar mengubah keputusan?" },
      { id: "q3", prompt: "Apa yang terjadi jika kamu hanya pakai checklist 5 baris?" },
      { id: "q4", prompt: "Informasi tambahan ini mengurangi risiko atau hanya mengurangi cemas?" },
    ],
    why: "Information overload (Gupta 2025).",
  },
];

export function getClinicModule(id: string | null | undefined): ClinicModule | undefined {
  if (!id) return undefined;
  return CLINIC_MODULES.find((m) => m.id === id);
}

/** Habit phase: no Plus locks. Flag stays on the module for a later wave. */
export function isClinicModulePlusOnly(_id: string | null | undefined): boolean {
  return false;
}
