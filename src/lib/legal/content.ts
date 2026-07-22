export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const termsOfService: LegalDocument = {
  slug: "syarat-dan-ketentuan",
  title: "Syarat & Ketentuan",
  eyebrow: "Legal",
  description:
    "Ketentuan penggunaan platform Bursa Trading Academy. Dengan mengakses, mendaftar, atau menggunakan layanan kami, kamu menyetujui seluruh syarat di bawah ini beserta Kebijakan Privasi kami.",
  lastUpdated: "22 Juli 2026",
  sections: [
    {
      id: "pengantar",
      title: "Pengantar & Penerimaan Ketentuan",
      paragraphs: [
        "Selamat datang di Bursa Trading Academy (\"Bursa\", \"Platform\", \"kami\"), platform edukasi trading dan investasi berbasis katalog multi-instruktur yang diakses melalui bursanalar.com. Syarat & Ketentuan ini (\"S&K\") merupakan perjanjian yang mengikat secara hukum antara kamu (\"Pengguna\", \"kamu\") dan Bursa.",
        "Dengan membuat akun, mengakses, atau menggunakan layanan Bursa dalam bentuk apa pun, kamu menyatakan telah membaca, memahami, dan menyetujui untuk terikat pada S&K ini serta Kebijakan Privasi kami. Jika kamu tidak menyetujui salah satu ketentuan, mohon untuk tidak menggunakan Platform.",
        "S&K ini tunduk pada dan ditafsirkan berdasarkan hukum Negara Republik Indonesia, termasuk UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), UU No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 jo. UU No. 1 Tahun 2024 tentang Informasi dan Transaksi Elektronik (UU ITE), dan UU No. 8 Tahun 1999 tentang Perlindungan Konsumen.",
      ],
    },
    {
      id: "definisi",
      title: "1. Definisi",
      paragraphs: [
        "Untuk kejelasan penafsiran, istilah-istilah berikut memiliki arti sebagaimana dijelaskan di bawah ini.",
      ],
      bullets: [
        "\"Platform\" adalah situs web, aplikasi, dan seluruh layanan digital yang dioperasikan oleh Bursa Trading Academy.",
        "\"Pengguna\" adalah setiap pihak yang mengakses Platform, mencakup Pelajar, Mentor, dan pengunjung.",
        "\"Pelajar\" adalah Pengguna yang membuat akun untuk mengakses konten pembelajaran.",
        "\"Mentor\" (atau \"Instruktur\") adalah pihak ketiga independen terverifikasi yang mempublikasikan kelas atau konten edukasi melalui Platform berdasarkan kapasitasnya sendiri.",
        "\"Konten\" adalah seluruh materi di Platform, termasuk video, teks, kuis, materi unduhan, sinyal/analisis, komentar, dan pesan komunitas.",
        "\"Konten Pengguna\" adalah materi yang kamu unggah, kirim, atau publikasikan, termasuk pesan diskusi, komentar, dan catatan.",
      ],
    },
    {
      id: "layanan",
      title: "2. Ruang Lingkup Layanan",
      paragraphs: [
        "Bursa menyediakan infrastruktur edukasi dan teknologi. Bursa BUKAN perusahaan efek, manajer investasi, penasihat investasi berlisensi, pialang berjangka, bank, atau lembaga jasa keuangan berizin OJK/Bappebti dalam bentuk apa pun, dan tidak menyediakan layanan broker, eksekusi transaksi, penitipan dana, atau rekomendasi investasi personal.",
        "Seluruh materi bersifat edukatif untuk membangun pemahaman dan keterampilan analisis. Setiap layanan yang diberikan Mentor melalui Platform merupakan tanggung jawab pribadi Mentor berdasarkan kapasitas dan (bila relevan) lisensi profesionalnya sendiri, bukan atas nama Bursa.",
        "Bursa dapat menambah, mengubah, menangguhkan, atau menghentikan fitur tertentu sewaktu-waktu untuk pengembangan produk atau kepatuhan regulasi.",
      ],
      bullets: [
        "Katalog kelas dan profil Mentor terverifikasi",
        "Ruang belajar terstruktur dengan video terproteksi dan pelacakan progres",
        "Fitur pendukung belajar: catatan pribadi (Notes), watchlist, dan bookmark",
        "Ruang komunitas diskusi serta sinyal/analisis internal (untuk anggota ruang tertentu)",
        "Pembelian akses kelas dengan pembagian komisi antara Platform dan Mentor",
      ],
    },
    {
      id: "kelayakan-akun",
      title: "3. Kelayakan & Akun Pengguna",
      paragraphs: [
        "Usia minimum: kamu wajib berusia minimal 18 (delapan belas) tahun atau telah cakap hukum untuk membuat perjanjian yang mengikat berdasarkan hukum Indonesia. Pengguna di bawah usia tersebut hanya boleh menggunakan Platform di bawah pengawasan dan persetujuan orang tua/wali yang turut tunduk pada S&K ini.",
        "Kamu wajib memberikan informasi yang benar, akurat, dan terkini saat mendaftar serta memperbaruinya bila terjadi perubahan. Kamu bertanggung jawab penuh atas kerahasiaan kredensial akun dan seluruh aktivitas yang terjadi di dalamnya.",
        "Akun bersifat personal. Berbagi akun dengan pihak lain dilarang, dan Bursa berhak membatasi jumlah perangkat aktif per akun sesuai kebijakan teknis yang berlaku.",
      ],
      bullets: [
        "Segera beri tahu kami jika terjadi akses tidak sah atau pelanggaran keamanan pada akunmu.",
        "Kami berhak menolak pendaftaran, menangguhkan, atau menutup akun yang melanggar ketentuan.",
        "Login Google (opsional) tunduk pada ketentuan ini dan Kebijakan Privasi kami.",
      ],
    },
    {
      id: "mentor",
      title: "4. Ketentuan Mentor / Instruktur",
      paragraphs: [
        "Mentor wajib melalui proses verifikasi sebelum profil dan kelas dipublikasikan. Mentor bertanggung jawab penuh atas keakuratan materi, kepatuhan terhadap regulasi yang berlaku, dan komunikasi yang transparan kepada Pelajar.",
        "Mentor dilarang menjanjikan keuntungan pasti atau bebas risiko, menyalahgunakan data Pelajar, menyamar sebagai pihak berlisensi tanpa dasar, atau mengarahkan Pelajar ke skema investasi di luar Platform tanpa pengungkapan risiko yang memadai.",
      ],
      bullets: [
        "Materi kelas dapat ditinjau tim Bursa sebelum publikasi.",
        "Komisi Platform indikatif sebesar 25% dari setiap transaksi kelas; rincian final ditampilkan sebelum konfirmasi.",
        "Mentor menetapkan harga kelasnya sendiri dalam batas kebijakan Platform.",
        "Mentor wajib mematuhi Kebijakan Privasi, perlindungan konten internal, dan perjanjian kemitraan yang berlaku.",
      ],
    },
    {
      id: "konten-pengguna",
      title: "5. Konten Pengguna & Lisensi",
      paragraphs: [
        "Kamu tetap memiliki hak atas Konten Pengguna yang kamu buat. Dengan mengunggah atau mempublikasikannya di Platform, kamu memberi Bursa lisensi non-eksklusif, bebas royalti, dapat disublisensikan, dan berlaku di seluruh dunia untuk menyimpan, menampilkan, dan memproses Konten Pengguna tersebut semata-mata untuk mengoperasikan dan meningkatkan layanan.",
        "Kamu menyatakan dan menjamin bahwa Konten Pengguna-mu tidak melanggar hukum, hak pihak ketiga, atau ketentuan ini. Catatan pribadi (Notes) bersifat privat secara default dan tidak dibagikan tanpa izin eksplisit sebagaimana diatur dalam Kebijakan Privasi.",
        "Bursa berhak, namun tidak berkewajiban, untuk meninjau, memoderasi, menahan, atau menghapus Konten Pengguna yang melanggar ketentuan ini.",
      ],
    },
    {
      id: "kekayaan-intelektual",
      title: "6. Hak Kekayaan Intelektual & Proteksi Konten",
      paragraphs: [
        "Seluruh Konten pembelajaran dilindungi hak cipta yang dimiliki Bursa dan/atau Mentor pembuatnya. Pembelian akses kelas memberikan lisensi terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk keperluan pembelajaran pribadi non-komersial sesuai jangka waktu akses produk yang dibeli.",
        "Dilarang merekam, menyalin, mengunduh di luar fitur resmi, mendistribusikan ulang, menayangkan ke publik, atau menjual kembali Konten tanpa izin tertulis. Upaya menghindari mekanisme proteksi konten (signed URL, watermark, pembatasan perangkat) merupakan pelanggaran berat yang dapat berujung penangguhan permanen dan tindakan hukum.",
        "Merek, logo, dan elemen visual Bursa adalah kekayaan intelektual Bursa dan tidak boleh digunakan tanpa izin tertulis.",
      ],
      bullets: [
        "Laporan pelanggaran hak cipta: kirim ke legal@bursanalar.com disertai identifikasi karya, lokasi konten, dan bukti kepemilikan.",
        "Kami akan meninjau laporan yang sah dan menurunkan konten yang terbukti melanggar (notice-and-takedown).",
      ],
    },
    {
      id: "penggunaan-terlarang",
      title: "7. Perilaku yang Dilarang",
      paragraphs: [
        "Saat menggunakan Platform, kamu dilarang melakukan hal-hal berikut. Pelanggaran dapat mengakibatkan penangguhan akun tanpa pemberitahuan sebelumnya dan/atau pelaporan kepada pihak berwenang.",
      ],
      bullets: [
        "Melanggar hukum yang berlaku, hak kekayaan intelektual, atau hak privasi pihak lain.",
        "Melakukan reverse-engineering, dekompilasi, scraping otomatis, atau ekstraksi data/Konten di luar antarmuka resmi.",
        "Menyebarkan konten menyesatkan, janji keuntungan pasti, penipuan, skema ponzi/MLM, atau spam.",
        "Menyalahgunakan sistem pembayaran, melakukan chargeback tidak sah, atau pencucian uang.",
        "Mengunggah malware, mengganggu keamanan/infrastruktur, atau mencoba akses tidak sah ke sistem atau akun lain.",
        "Melecehkan, mengintimidasi, atau merugikan Pengguna lain di ruang komunitas.",
        "Berbagi, menyewakan, atau memperjualbelikan akses akun kepada pihak lain.",
      ],
    },
    {
      id: "pembayaran",
      title: "8. Pembayaran, Harga & Pajak",
      paragraphs: [
        "Pembayaran kelas dilakukan per kelas. Setelah pembayaran berhasil diverifikasi, akses kelas aktif sesuai ketentuan produk. Rincian harga, komisi Platform, dan payout Mentor ditampilkan pada halaman checkout sebelum konfirmasi.",
        "Pembayaran diproses melalui mitra payment gateway resmi. Bursa tidak pernah menyimpan data kartu pembayaran mentah — seluruh pemrosesan kartu tunduk pada standar keamanan mitra yang tersertifikasi PCI-DSS.",
        "Harga dapat sudah atau belum termasuk pajak (mis. PPN atas jasa digital) sesuai ketentuan perpajakan Indonesia yang berlaku pada saat transaksi. Bursa berhak mengubah struktur harga di masa mendatang dengan pemberitahuan yang wajar bagi produk yang bersifat berkelanjutan.",
      ],
    },
    {
      id: "refund",
      title: "9. Kebijakan Pengembalian Dana (Refund)",
      paragraphs: [
        "Secara umum, pembelian akses kelas bersifat final mengingat sifat produk digital yang dapat diakses segera setelah pembayaran. Namun, ketentuan ini tidak menghapus hak-hakmu yang dilindungi secara memaksa oleh peraturan perundang-undangan, termasuk UU Perlindungan Konsumen.",
        "Pengembalian dana dapat diberikan dalam hal berikut, dievaluasi berdasarkan itikad baik: (a) kegagalan teknis Platform yang menyebabkan kelas tidak dapat diakses dan tidak dapat kami perbaiki dalam waktu wajar; (b) kelas secara material tidak sesuai dengan deskripsi yang dipublikasikan; atau (c) kesalahan penagihan atau transaksi ganda.",
        "Permintaan pengembalian dana diajukan melalui support@bursanalar.com dengan menyertakan bukti transaksi dan alasan. Kami akan menanggapi dalam waktu wajar sesuai prosedur operasional yang berlaku.",
      ],
    },
    {
      id: "komunitas-sinyal",
      title: "10. Komunitas & Sinyal Internal",
      paragraphs: [
        "Ruang komunitas dan fitur sinyal/analisis internal (jika tersedia untuk ruang tertentu) merupakan sarana diskusi dan edukasi. Sinyal atau analisis yang dibagikan Mentor merupakan pendapat pribadi Mentor berdasarkan kapasitasnya sendiri, BUKAN rekomendasi investasi resmi dari Bursa.",
        "Kamu bertanggung jawab atas kepatuhan terhadap aturan komunitas. Bursa berhak memoderasi, membatasi, atau mengeluarkan Pengguna yang melanggar aturan komunitas atau S&K ini.",
      ],
    },
    {
      id: "risiko",
      title: "11. Penyangkalan Risiko Investasi",
      paragraphs: [
        "Bacalah bagian ini dengan saksama. Seluruh Konten bersifat edukasi dan pengembangan keterampilan analisis, dan tidak dimaksudkan serta tidak boleh ditafsirkan sebagai nasihat, rekomendasi, ajakan, atau anjuran untuk membeli, menjual, atau menahan efek, aset kripto, kontrak berjangka, atau instrumen keuangan apa pun.",
        "Trading dan investasi mengandung risiko kehilangan modal, sebagian maupun seluruhnya. Kinerja masa lalu tidak menjamin hasil di masa depan. Setiap statistik performa historis bersifat retrospektif dan bukan jaminan hasil.",
        "Keputusan trading dan investasi sepenuhnya merupakan risiko dan tanggung jawab pribadimu. Bursa, pengurus, karyawan, dan Mentor tidak bertanggung jawab atas kerugian finansial yang timbul dari keputusan yang kamu ambil berdasarkan Konten di Platform.",
      ],
    },
    {
      id: "penafian-jaminan",
      title: "12. Penafian Jaminan",
      paragraphs: [
        "Sepanjang diizinkan hukum, Platform dan seluruh Konten disediakan \"sebagaimana adanya\" (as is) dan \"sebagaimana tersedia\" (as available), tanpa jaminan tersurat maupun tersirat mengenai keakuratan, kelengkapan, kesesuaian untuk tujuan tertentu, atau ketersediaan tanpa gangguan.",
        "Kami tidak menjamin bahwa layanan akan selalu bebas kesalahan, aman dari gangguan, atau bahwa data pasar/pihak ketiga yang ditampilkan selalu akurat dan mutakhir.",
      ],
    },
    {
      id: "batasan-tanggung-jawab",
      title: "13. Batasan Tanggung Jawab",
      paragraphs: [
        "Sepanjang diizinkan hukum yang berlaku, Bursa beserta pengurus, karyawan, dan afiliasinya tidak bertanggung jawab atas kerugian tidak langsung, insidental, konsekuensial, khusus, atau kehilangan keuntungan yang timbul dari penggunaan atau ketidakmampuan menggunakan Platform, keputusan trading/investasi Pengguna, ketidaktersediaan layanan sementara, kesalahan data pihak ketiga, atau tindakan/ucapan Mentor di luar kendali wajar Bursa.",
        "Tanggung jawab total Bursa atas klaim apa pun sehubungan dengan layanan dibatasi maksimal sebesar jumlah yang telah kamu bayarkan kepada Bursa untuk produk/layanan terkait dalam 12 (dua belas) bulan terakhir sebelum timbulnya klaim.",
        "Pembatasan ini tidak mengurangi hak Pengguna yang dilindungi secara memaksa oleh peraturan perundang-undangan Indonesia (termasuk UU Perlindungan Konsumen) dan tidak berlaku untuk kelalaian berat atau kesengajaan Bursa.",
      ],
    },
    {
      id: "ganti-rugi",
      title: "14. Ganti Rugi (Indemnifikasi)",
      paragraphs: [
        "Kamu setuju untuk membebaskan dan mengganti kerugian Bursa beserta pengurus, karyawan, dan afiliasinya dari setiap klaim, tuntutan, kerugian, atau biaya (termasuk biaya hukum yang wajar) yang timbul dari pelanggaranmu terhadap S&K ini, pelanggaran hukum atau hak pihak ketiga, atau penyalahgunaan Platform.",
      ],
    },
    {
      id: "penangguhan",
      title: "15. Penangguhan & Penghentian Akun",
      paragraphs: [
        "Bursa berhak menangguhkan sementara atau menghentikan permanen akun yang melanggar S&K ini secara material, membahayakan Pengguna lain, atau melanggar hukum. Untuk pelanggaran non-berat, kami akan mengupayakan pemberitahuan dan kesempatan klarifikasi sebelum penghentian permanen.",
        "Kamu dapat menghentikan penggunaan dan meminta penghapusan akun kapan saja melalui pengaturan atau kontak support. Ketentuan yang menurut sifatnya tetap berlaku (kekayaan intelektual, batasan tanggung jawab, penyelesaian sengketa) akan tetap berlaku setelah akun berakhir.",
      ],
    },
    {
      id: "pihak-ketiga",
      title: "16. Layanan & Tautan Pihak Ketiga",
      paragraphs: [
        "Platform dapat memuat tautan atau integrasi ke layanan pihak ketiga (mis. penyedia login, pembayaran, atau sumber data pasar). Bursa tidak mengendalikan dan tidak bertanggung jawab atas konten, kebijakan, atau praktik layanan pihak ketiga tersebut. Penggunaanmu atas layanan pihak ketiga tunduk pada ketentuan masing-masing.",
      ],
    },
    {
      id: "komunikasi",
      title: "17. Komunikasi Elektronik",
      paragraphs: [
        "Dengan menggunakan Platform, kamu menyetujui menerima komunikasi elektronik dari kami (email, notifikasi in-app) terkait akun, transaksi, keamanan, dan pembaruan layanan. Komunikasi elektronik ini memenuhi persyaratan hukum sebagaimana komunikasi tertulis.",
      ],
    },
    {
      id: "force-majeure",
      title: "18. Keadaan Kahar (Force Majeure)",
      paragraphs: [
        "Bursa tidak bertanggung jawab atas kegagalan atau keterlambatan pelaksanaan kewajiban yang disebabkan oleh keadaan di luar kendali wajar, termasuk bencana alam, pandemi, gangguan jaringan/listrik, serangan siber, tindakan pemerintah, atau kegagalan penyedia infrastruktur pihak ketiga.",
      ],
    },
    {
      id: "perubahan",
      title: "19. Perubahan Ketentuan",
      paragraphs: [
        "Kami dapat memperbarui S&K ini dari waktu ke waktu untuk menyesuaikan regulasi, fitur, atau kebijakan internal. Perubahan material akan diberitahukan melalui email dan/atau notifikasi platform sebelum berlaku efektif. Penggunaan berkelanjutan setelah tanggal efektif dianggap sebagai persetujuan atas perubahan tersebut.",
      ],
    },
    {
      id: "hukum-sengketa",
      title: "20. Hukum yang Berlaku & Penyelesaian Sengketa",
      paragraphs: [
        "S&K ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.",
        "Setiap perselisihan yang timbul akan diupayakan diselesaikan terlebih dahulu melalui musyawarah dengan itikad baik dalam waktu 30 (tiga puluh) hari sejak pemberitahuan tertulis. Apabila musyawarah tidak mencapai kesepakatan, sengketa akan diselesaikan melalui pengadilan negeri yang berwenang di wilayah Republik Indonesia sesuai domisili hukum penyelenggara Platform, tanpa mengurangi hak konsumen untuk menempuh jalur penyelesaian sengketa konsumen sesuai peraturan yang berlaku.",
      ],
    },
    {
      id: "ketentuan-umum",
      title: "21. Ketentuan Umum",
      paragraphs: [
        "S&K ini beserta Kebijakan Privasi merupakan keseluruhan perjanjian antara kamu dan Bursa terkait penggunaan Platform.",
      ],
      bullets: [
        "Keterpisahan: jika suatu ketentuan dinyatakan tidak sah, ketentuan lain tetap berlaku penuh.",
        "Pelepasan hak: kegagalan Bursa menegakkan suatu ketentuan bukan merupakan pelepasan hak atas ketentuan tersebut.",
        "Pengalihan: kamu tidak dapat mengalihkan hak/kewajiban tanpa persetujuan tertulis Bursa; Bursa dapat mengalihkannya dalam rangka reorganisasi atau pengalihan usaha.",
        "Bahasa: S&K ini dibuat dalam Bahasa Indonesia sebagai versi yang mengikat; terjemahan bahasa lain hanya untuk kemudahan.",
      ],
    },
    {
      id: "perlindungan-konsumen",
      title: "22. Perlindungan Konsumen & Pengaduan",
      paragraphs: [
        "Sebagai konsumen, kamu memiliki hak sesuai UU No. 8 Tahun 1999 tentang Perlindungan Konsumen. Untuk pengaduan, hubungi kami terlebih dahulu di support@bursanalar.com agar dapat kami selesaikan secara langsung.",
        "Apabila pengaduan tidak terselesaikan, kamu berhak menempuh jalur penyelesaian sengketa konsumen melalui lembaga yang berwenang (mis. BPKN atau LAPS sektor terkait) sesuai peraturan yang berlaku.",
      ],
    },
    {
      id: "kontak",
      title: "23. Kontak",
      paragraphs: [
        "Untuk pertanyaan mengenai S&K ini, hubungi kami:",
      ],
      bullets: [
        "Dukungan umum: support@bursanalar.com",
        "Privasi & data pribadi: privacy@bursanalar.com",
        "Hak kekayaan intelektual & hukum: legal@bursanalar.com",
      ],
    },
  ],
};

export const privacyPolicy: LegalDocument = {
  slug: "kebijakan-privasi",
  title: "Kebijakan Privasi",
  eyebrow: "Legal",
  description:
    "Cara Bursa mengumpulkan, menggunakan, dan melindungi data pribadimu saat menggunakan platform edukasi trading kami.",
  lastUpdated: "11 Juli 2026",
  sections: [
    {
      id: "data-dikumpulkan",
      title: "1. Data yang Kami Kumpulkan",
      paragraphs: ["Kami mengumpulkan data yang kamu berikan langsung dan data penggunaan otomatis:"],
      bullets: [
        "Identitas: nama, email, nomor telepon (opsional), username",
        "Akun: kata sandi ter-hash (bcrypt), preferensi tampilan, riwayat enrollment",
        "Login Google (opsional): email, nama tampilan, dan URL foto profil publik dari akun Google — kami tidak mengakses Gmail, kontak, atau kalender",
        "Reset kata sandi: alamat email untuk mengirim tautan reset (token disimpan sebagai hash, bukan plaintext)",
        "Transaksi: kelas yang dibeli, status pembayaran, bukti transaksi",
        "Komunitas: pesan chat, reaksi, dan aktivitas di ruang diskusi",
        "Teknis: alamat IP, perangkat, log akses untuk keamanan",
      ],
    },
    {
      id: "penggunaan",
      title: "2. Cara Kami Menggunakan Data",
      paragraphs: ["Data digunakan untuk menyediakan dan meningkatkan layanan platform:"],
      bullets: [
        "Autentikasi akun (email/kata sandi atau Google) dan manajemen enrollment kelas",
        "Pemrosesan pembayaran dan rekonsiliasi dengan mentor",
        "Pengiriman tautan reset kata sandi saat kamu memintanya",
        "Komunikasi penting terkait kelas, pembaruan, dan keamanan",
        "Moderasi konten dan pencegahan penyalahgunaan",
        "Analitik agregat untuk meningkatkan pengalaman belajar (tanpa menjual data pribadi)",
      ],
    },
    {
      id: "berbagi",
      title: "3. Berbagi Data dengan Pihak Ketiga",
      paragraphs: [
        "Kami tidak menjual data pribadimu. Data dapat dibagikan kepada penyedia layanan tepercaya (pembayaran, hosting, email) yang terikat perjanjian kerahasiaan.",
        "Login Google memproses data melalui Google OAuth — hanya email dan profil publik. Kamu bisa mencabut akses Google kapan saja melalui pengaturan akun Google (Security → Third-party access).",
        "Mentor menerima informasi terbatas yang diperlukan untuk mengelola murid dan kelas (nama, email enrollment, progress belajar).",
      ],
    },
    {
      id: "penyimpanan",
      title: "4. Penyimpanan & Keamanan",
      paragraphs: [
        "Data disimpan di server dengan enkripsi transit (TLS) dan kontrol akses berbasis peran. Kata sandi di-hash dengan bcrypt (cost ≥ 12) dan tidak pernah disimpan dalam bentuk plain text.",
        "Tautan reset kata sandi berlaku 30 menit, single-use, dan disimpan sebagai hash di database. Permintaan reset selalu mendapat respons yang sama untuk mencegah enumerasi email.",
        "Kami menyimpan data selama akun aktif atau sesuai kewajiban hukum. Kamu dapat meminta penghapusan akun melalui pengaturan atau kontak support.",
      ],
    },
    {
      id: "hak-pengguna",
      title: "5. Hak Pengguna",
      paragraphs: ["Sesuai peraturan perlindungan data yang berlaku, kamu berhak untuk:"],
      bullets: [
        "Mengakses dan memperbarui data profil",
        "Meminta salinan data pribadi yang kami simpan",
        "Menarik persetujuan pemrosesan data non-esensial",
        "Meminta penghapusan akun (dengan pengecualian data yang wajib disimpan secara hukum)",
      ],
    },
    {
      id: "cookie",
      title: "6. Cookie & Penyimpanan Lokal",
      paragraphs: [
        "Kami menggunakan cookie dan local storage untuk sesi login, preferensi tema, dan fungsi dasar platform. Cookie analitik (jika ada) dapat dinonaktifkan melalui pengaturan browser.",
      ],
    },
    {
      id: "kontak",
      title: "7. Kontak Privasi",
      paragraphs: [
        "Untuk pertanyaan terkait privasi atau permintaan data, hubungi tim kami di privacy@bursanalar.com. Kami akan merespons dalam waktu maksimal 14 hari kerja.",
      ],
    },
  ],
};

export const legalDocuments = [termsOfService, privacyPolicy] as const;

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return legalDocuments.find((doc) => doc.slug === slug);
}
