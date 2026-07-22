---
portal: TRUST
slug: pelaporan
title: Pelaporan Kerentanan
eyebrow: Pusat Kepercayaan
description: Kebijakan responsible disclosure Bursa — cara melaporkan celah keamanan secara aman.
sortOrder: 4
---

_Berlaku efektif: 22 Juli 2026_

Kami menghargai kontribusi komunitas keamanan dalam menjaga platform Bursa aman. Jika kamu menemukan kerentanan keamanan, laporkan secara responsible.

## Responsible Disclosure

### Apa yang Dilaporkan

- Celah keamanan di aplikasi web Bursa (bursanalar.com / bursanalar.vercel.app)
- Kelemahan autentikasi, otorisasi, atau injeksi
- Kebocoran data yang tidak seharusnya
- Misconfiguration yang expose data sensitif

### Apa yang TIDAK Dilaporkan di Sini

- Spam/phishing (laporkan ke support@bursanalar.com)
- Bug UI/UX non-keamanan (laporkan ke support@bursanalar.com)
- Keluhan privasi data (gunakan [Permintaan Data](/privasi/permintaan-data))

## Cara Melaporkan

Kirim email ke **[security@bursanalar.com](mailto:security@bursanalar.com)** dengan:

1. **Deskripsi kerentanan** — jelaskan secara detail
2. **Langkah reproduksi** — step-by-step agar kami bisa verifikasi
3. **Dampak potensial** — data/fungsi apa yang terpengaruh
4. **Proof of concept** — screenshot atau PoC (jangan exploit data user nyata)
5. **Kontak kamu** — untuk follow-up

## Apa yang Kami Janjikan

| Komitmen | Detail |
|----------|--------|
| **Acknowledgment** | Konfirmasi penerimaan dalam 3 hari kerja |
| **Assessment** | Evaluasi severity dalam 7 hari kerja |
| **Fix timeline** | Komunikasi timeline perbaikan berdasarkan severity |
| **No retaliation** | Tidak akan menuntut researcher yang patuh kebijakan ini |
| **Recognition** | Credit (jika diinginkan) setelah fix verified |

## Scope & Batasan

### In Scope
- `*.bursanalar.com`, `bursanalar.vercel.app`
- API endpoints publik
- Autentikasi & otorisasi

### Out of Scope
- Social engineering / phishing
- DoS/DDoS attacks
- Physical security
- Kerentanan pihak ketiga (laporkan langsung ke vendor)

## Larangan

- **Jangan** akses, modifikasi, atau hapus data user lain
- **Jangan** exploit kerentanan beyond verifikasi
- **Jangan** publikasikan sebelum kami fix (coordinated disclosure)
- **Jangan** gunakan automated scanner yang overload sistem

## Insiden Data (Kebocoran)

Jika kamu menemukan bukti kebocoran data aktif:
1. Laporkan segera ke security@bursanalar.com
2. Jangan download/arsipkan data user
3. Kami akan activate incident response plan

## Bug Bounty

Program bug bounty **belum tersedia** saat ini. Kami pertimbangkan setelah launch publik dan penetration test eksternal.

## Kontak

- **Keamanan:** [security@bursanalar.com](mailto:security@bursanalar.com)
- **PGP Key:** Tersedia on request
