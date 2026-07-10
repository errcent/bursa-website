export type ArticleCategory =
  | "Saham"
  | "Crypto"
  | "Forex"
  | "Fundamental"
  | "Teknikal"
  | "Psikologi";

export type ArticleContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "quote"; text: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readTimeMinutes: number;
  publishedAt: string;
  author: string;
  blocks: ArticleContentBlock[];
}

export const articles: Article[] = [
  {
    slug: "membaca-candlestick-pemula",
    title: "Membaca Candlestick untuk Pemula",
    excerpt:
      "Panduan singkat memahami body, wick, dan pola candlestick dasar sebelum masuk ke analisis teknikal yang lebih dalam.",
    category: "Teknikal",
    readTimeMinutes: 6,
    publishedAt: "28 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Candlestick adalah representasi visual pergerakan harga dalam periode waktu tertentu. Setiap batang menampilkan harga buka, tutup, tertinggi, dan terendah — informasi yang sama dengan bar chart, tetapi lebih mudah dibaca sekilas.",
      },
      { type: "heading", level: 2, text: "Anatomi candlestick" },
      {
        type: "bullets",
        items: [
          "Body (badan): jarak antara harga buka dan tutup. Body hijau/bullish berarti harga tutup di atas harga buka.",
          "Wick (sumbu): garis tipis di atas dan bawah body yang menunjukkan harga ekstrem selama periode.",
          "Range: selisih antara high dan low — semakin panjang wick, semakin volatil periode tersebut.",
        ],
      },
      { type: "heading", level: 2, text: "Tiga pola dasar yang sering muncul" },
      {
        type: "paragraph",
        text: "Doji menandakan keragu-raguan pasar — harga buka dan tutup hampir sama. Hammer muncul setelah downtrend dan bisa jadi sinyal pembalikan, terutama jika wick bawah panjang. Engulfing bullish terjadi ketika candle bullish menelan seluruh body candle bearish sebelumnya.",
      },
      {
        type: "quote",
        text: "Pola candlestick bukan sinyal beli/jual otomatis. Selalu konfirmasi dengan konteks trend, volume, dan level support/resistance.",
      },
      { type: "heading", level: 3, text: "Latihan praktis" },
      {
        type: "paragraph",
        text: "Buka chart saham atau crypto favoritmu di timeframe daily. Tandai 10 candle terakhir, identifikasi body vs wick, lalu cari apakah ada pola doji atau hammer. Catat apa yang terjadi pada harga 3–5 candle berikutnya — ini latihan observasi, bukan prediksi.",
      },
    ],
  },
  {
    slug: "cara-membaca-laporan-keuangan",
    title: "Cara Membaca Laporan Keuangan Emiten",
    excerpt:
      "Tiga laporan utama — neraca, laba rugi, dan arus kas — serta metrik yang perlu diperhatikan investor pemula.",
    category: "Fundamental",
    readTimeMinutes: 8,
    publishedAt: "25 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Analisis fundamental dimulai dari laporan keuangan resmi emiten. Di Indonesia, laporan ini dipublikasikan secara berkala dan bisa diakses melalui situs BEI atau portal emiten.",
      },
      { type: "heading", level: 2, text: "Tiga laporan inti" },
      {
        type: "bullets",
        items: [
          "Laporan Posisi Keuangan (Neraca): snapshot aset, liabilitas, dan ekuitas perusahaan.",
          "Laporan Laba Rugi: pendapatan, beban, dan profitabilitas dalam periode tertentu.",
          "Laporan Arus Kas: uang masuk dan keluar dari operasional, investasi, dan pendanaan.",
        ],
      },
      { type: "heading", level: 2, text: "Metrik yang wajib dicek" },
      {
        type: "paragraph",
        text: "Untuk pemula, fokus ke pertumbuhan pendapatan YoY, margin laba bersih, rasio utang terhadap ekuitas (DER), dan arus kas operasional positif. Perusahaan dengan laba tinggi tapi arus kas operasional negatif perlu investigasi lebih lanjut.",
      },
      { type: "heading", level: 3, text: "Konteks sektor" },
      {
        type: "paragraph",
        text: "Bank dinilai berbeda dengan retail atau teknologi. Bandingkan metrik emiten dengan peer di sektor yang sama, bukan dengan emiten acak. PER 15 di sektor consumer goods berbeda maknanya dengan PER 15 di sektor properti.",
      },
    ],
  },
  {
    slug: "support-dan-resistance",
    title: "Mengenal Support dan Resistance",
    excerpt:
      "Level harga di mana buying atau selling pressure cenderung muncul — fondasi analisis teknikal yang paling sering dipakai trader.",
    category: "Teknikal",
    readTimeMinutes: 5,
    publishedAt: "22 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Support adalah level harga di mana tekanan beli cenderung muncul, mencegah harga turun lebih jauh. Resistance kebalikannya — level di mana tekanan jual muncul dan harga sulit menembus ke atas.",
      },
      { type: "heading", level: 2, text: "Cara mengidentifikasi level" },
      {
        type: "bullets",
        items: [
          "Titik bounce berulang: harga memantul dari area yang sama minimal 2–3 kali.",
          "Round numbers: 5.000, 10.000 sering menjadi psikologis support/resistance.",
          "Previous high/low: high sebelumnya sering jadi resistance, low sebelumnya jadi support.",
        ],
      },
      {
        type: "quote",
        text: "Support yang sudah ditembus bisa berubah menjadi resistance — dan sebaliknya. Ini disebut role reversal.",
      },
      { type: "heading", level: 3, text: "Tips praktis" },
      {
        type: "paragraph",
        text: "Gambar zone, bukan garis tipis. Support dan resistance adalah area, bukan harga exact. Kombinasikan dengan volume — breakout dengan volume tinggi lebih valid dibanding breakout tipis tanpa volume.",
      },
    ],
  },
  {
    slug: "risk-management-aturan-1-persen",
    title: "Risk Management: Aturan 1% per Trade",
    excerpt:
      "Mengapa membatasi risiko per transaksi adalah skill paling penting — lebih dari entry atau exit yang sempurna.",
    category: "Psikologi",
    readTimeMinutes: 7,
    publishedAt: "18 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Aturan 1% berarti kamu tidak pernah mempertaruhkan lebih dari 1% total modal pada satu transaksi. Dengan modal Rp100 juta, risiko maksimal per trade adalah Rp1 juta — bukan nominal posisi Rp1 juta, melainkan kerugian maksimal jika stop loss kena.",
      },
      { type: "heading", level: 2, text: "Menghitung ukuran posisi" },
      {
        type: "paragraph",
        text: "Rumus sederhana: Ukuran Posisi = (Modal × 1%) ÷ (Entry − Stop Loss). Contoh: modal Rp50 juta, risiko 1% = Rp500.000. Entry Rp5.000, stop loss Rp4.800 (selisih Rp200). Posisi = Rp500.000 ÷ Rp200 = 2.500 lembar.",
      },
      { type: "heading", level: 2, text: "Manfaat jangka panjang" },
      {
        type: "bullets",
        items: [
          "10 loss beruntun hanya mengurangi modal ~10%, bukan 50% atau lebih.",
          "Kamu bisa trading dengan tenang tanpa FOMO atau revenge trading.",
          "Konsistensi risk/reward ratio (misalnya 1:2) menjadi achievable.",
        ],
      },
      {
        type: "quote",
        text: "Trader yang survive bukan yang paling sering benar — melainkan yang paling disiplin membatasi kerugian.",
      },
    ],
  },
  {
    slug: "memulai-trading-crypto-aman",
    title: "Memulai Trading Crypto dengan Aman",
    excerpt:
      "Langkah awal memilih exchange, mengamankan wallet, dan menghindari kesalahan umum pemula di pasar crypto.",
    category: "Crypto",
    readTimeMinutes: 6,
    publishedAt: "15 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Crypto menawarkan volatilitas tinggi dan akses 24/7, tetapi juga risiko unik: hack exchange, scam token, dan leverage berlebihan. Pendekatan aman dimulai dari edukasi, bukan dari chasing pump.",
      },
      { type: "heading", level: 2, text: "Checklist pemula" },
      {
        type: "bullets",
        items: [
          "Gunakan exchange terdaftar dan aktifkan 2FA (authenticator app, bukan SMS).",
          "Mulai dengan Bitcoin dan Ethereum sebelum eksplor altcoin.",
          "Jangan simpan semua aset di exchange — pertimbangkan cold wallet untuk holding jangka panjang.",
          "Waspada DM yang menjanjikan signal VIP atau guaranteed profit.",
        ],
      },
      { type: "heading", level: 2, text: "Volatilitas bukan alasan skip risk management" },
      {
        type: "paragraph",
        text: "Stop loss tetap wajib meski pasar crypto bergerak cepat. Gunakan position sizing kecil saat belajar. Catat setiap trade di journal — win rate dan R:R jauh lebih penting daripada satu trade untung besar.",
      },
    ],
  },
  {
    slug: "pasangan-mata-uang-major-forex",
    title: "Mengenal Pasangan Mata Uang Major di Forex",
    excerpt:
      "EUR/USD, GBP/USD, USD/JPY — karakteristik pasangan major dan mengapa mereka populer di kalangan trader pemula.",
    category: "Forex",
    readTimeMinutes: 5,
    publishedAt: "12 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Pasangan major melibatkan USD dan mata uang ekonomi besar lainnya. Mereka paling likuid, spread tipis, dan banyak sumber analisis — ideal untuk belajar mekanisme forex sebelum masuk ke pasangan eksotis.",
      },
      { type: "heading", level: 2, text: "Empat major yang paling diperdagangkan" },
      {
        type: "bullets",
        items: [
          "EUR/USD — pasangan paling likuid di dunia, spread rendah, reaksi terhadap data ECB dan Fed.",
          "GBP/USD (Cable) — volatilitas lebih tinggi, sensitif terhadap kebijakan BoE.",
          "USD/JPY — safe haven flow, dipengaruhi yield differential AS–Jepang.",
          "USD/CHF — sering bergerak inverse dengan EUR/USD.",
        ],
      },
      { type: "heading", level: 3, text: "Waktu trading" },
      {
        type: "paragraph",
        text: "Overlap sesi London–New York (sekitar 19:00–00:00 WIB) biasanya volume tertinggi. Hindari trading saat spread melebar di akhir pekan atau libur bank major.",
      },
    ],
  },
  {
    slug: "swing-trading-vs-day-trading",
    title: "Swing Trading vs Day Trading: Mana yang Cocok?",
    excerpt:
      "Perbandingan timeframe, komitmen waktu, dan gaya trading untuk membantu kamu memilih pendekatan yang realistis.",
    category: "Saham",
    readTimeMinutes: 7,
    publishedAt: "8 Juni 2026",
    author: "Tim Edukasi Bursa",
    blocks: [
      {
        type: "paragraph",
        text: "Day trading menutup posisi dalam hari yang sama; swing trading menahan posisi beberapa hari hingga minggu. Keduanya valid — pilihan terbaik tergantung waktu luang, toleransi stres, dan modal.",
      },
      { type: "heading", level: 2, text: "Day trading" },
      {
        type: "bullets",
        items: [
          "Membutuhkan pantauan aktif selama jam bursa.",
          "Cocok untuk yang bisa fokus penuh tanpa gangguan pekerjaan.",
          "Biaya transaksi dan emosi lebih intens karena frekuensi trade tinggi.",
        ],
      },
      { type: "heading", level: 2, text: "Swing trading" },
      {
        type: "bullets",
        items: [
          "Analisis di luar jam bursa, eksekusi 1–3 kali seminggu.",
          "Lebih cocok untuk pekerja kantoran dengan waktu terbatas.",
          "Memberi ruang untuk setup berkualitas tanpa FOMO setiap candle.",
        ],
      },
      {
        type: "quote",
        text: "Tidak ada gaya trading yang superior. Yang superior adalah konsistensi menerapkan sistem yang sesuai gaya hidupmu.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getAllArticles(): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export const articleCategories: ArticleCategory[] = [
  "Saham",
  "Crypto",
  "Forex",
  "Fundamental",
  "Teknikal",
  "Psikologi",
];
