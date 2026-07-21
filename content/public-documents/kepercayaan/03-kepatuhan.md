---
portal: TRUST
slug: kepatuhan
title: Kepatuhan Regulasi
eyebrow: Pusat Kepercayaan
description: Kepatuhan Bursa terhadap UU PDP, POJK 6/2026, dan standar keamanan industri.
sortOrder: 3
---

_Berlaku efektif: 22 Juli 2026_

## Posisi Regulasi Platform

Bursa adalah **platform edukasi trading** — bukan Penyedia Jasa Keuangan (PUJK), broker, atau penasihat investasi. Kami menyediakan infrastruktur belajar, bukan eksekusi trading atau rekomendasi investasi personal.

## UU No. 27/2022 — Pelindungan Data Pribadi

| Aspek | Implementasi Bursa |
|-------|-------------------|
| Pengendali Data Pribadi | Bursa sebagai controller |
| Dasar hukum pemrosesan | Consent, kontrak, kewajiban hukum, legitimate interest |
| Hak subjek data | Form permintaan + email privacy@bursa.id |
| Keamanan data | TLS, bcrypt, RBAC, audit log |
| Notifikasi kebocoran | SOP 3×24 jam ke otoritas + pengguna |
| DPO | Penanggung jawab internal (dirangkap compliance reviewer) |

Detail: [Kebijakan Privasi](/privasi/kebijakan).

## POJK No. 6/2026 — Finfluencer & Edukasi Keuangan

| Kewajiban | Implementasi |
|-----------|--------------|
| Tidak menjanjikan profit | Disclaimer di ToS, review konten mentor |
| Edukasi bukan rekomendasi | Scope platform = edukasi terstruktur |
| Verifikasi mentor | KYC + lisensi OJK/Bappebti dicek sebelum tayang |
| Konten compliance | Tim review kurikulum sebelum publikasi |

Platform **tidak memerlukan** izin PUJK OJK karena bukan layanan jasa keuangan — namun wajib patuh sebagai penyampai informasi edukasi keuangan.

## POJK No. 13/2025 — Rekomendasi Saham

Rekomendasi spesifik buy/sell memerlukan lisensi Penasihat Investasi (PI) aktif. Bursa:
- **Tidak** menyediakan rekomendasi investasi platform-level
- Mentor dengan rekomendasi spesifik wajib punya lisensi PI
- Fitur Signal (jika diaktifkan) hanya dari mentor berlisensi PI

## PCI-DSS (Pembayaran)

- Bursa **tidak menyimpan** data kartu (PAN, CVV)
- Pemrosesan via payment gateway bersertifikasi PCI-DSS
- Target scope: SAQ A (hosted payment page)

## GDPR-Ready

Meskipun fokus utama UU PDP, kami menerapkan prinsip GDPR-compatible:
- Data minimization
- Privacy by design
- Right to erasure
- Data portability (JSON export)

Relevan jika platform menerima pengguna internasional.

## PSE (Penyelenggara Sistem Elektronik)

Pendaftaran PSE Kominfo direncanakan sebelum launch publik skala penuh.

## Checklist Pre-Launch

- [ ] ToS & Privacy Policy final (review advokat)
- [ ] Mentor Agreement signed
- [ ] PSE registered
- [ ] Payment gateway merchant active
- [ ] POJK 6/2026 content policy enforced
- [ ] DPO designated
- [ ] Penetration test completed
