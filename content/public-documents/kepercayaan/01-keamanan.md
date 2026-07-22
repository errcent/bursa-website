---
portal: TRUST
slug: keamanan
title: Program Keamanan
eyebrow: Pusat Kepercayaan
description: Ringkasan program keamanan informasi Bursa — prinsip, arsitektur, dan praktik operasional.
sortOrder: 1
---

_Berlaku efektif: 22 Juli 2026_

Program keamanan Bursa menerapkan kontrol teknis dan organisasional best-practice. Sertifikasi formal (SOC 2, ISO 27001) ada dalam roadmap; status implementasi setiap kontrol dijelaskan secara transparan di halaman ini.

## Prinsip Fundamental

| Prinsip | Implementasi |
|---------|--------------|
| **Least privilege** | Setiap role admin hanya akses data minimum untuk tugasnya |
| **Data minimization** | Kumpulkan hanya data diperlukan untuk edukasi & pembayaran |
| **Encryption in transit** | TLS 1.2+ di semua endpoint |
| **Encryption at rest** | Kolom sensitif (KYC, rekening bank) dienkripsi di database |
| **Purpose limitation** | Data KYC mentor tidak untuk marketing tanpa consent |
| **Accountability** | Audit log untuk akses data sensitif |
| **Privacy by design** | Masking PII di admin panel sejak MVP |

## Arsitektur Keamanan

```
Pengguna → TLS → Vercel Edge → Next.js App → RBAC API → PostgreSQL (encrypted)
                                    ↓
                              Payment Gateway (PCI delegated)
```

### Autentikasi
- Kata sandi di-hash **bcrypt** (cost ≥ 12)
- Reset password: token hash, single-use, 30 menit expiry
- Google OAuth opsional — scope minimal (email + profil publik)
- Rate limiting pada endpoint auth & API sensitif

### Pembayaran
- **Tidak menyimpan data kartu** — delegasi penuh ke Midtrans/Xendit
- Scope PCI minimal (SAQ A) saat payment hosted page aktif

### Video & Konten
- Akses video berbasis enrollment — bukan URL publik
- Proteksi konten: larangan redistribusi (ToS)

## Data yang Dilindungi Khusus

| Data | Perlindungan |
|------|--------------|
| Notes pelajar | 100% privat — admin tidak bisa akses |
| KYC mentor | Enkripsi at-rest, akses compliance only |
| Password | Hash bcrypt — never plaintext |
| Session tokens | HttpOnly cookies (target production) |
| Payment card | Tidak pernah disimpan |

## Status Implementasi

| Kontrol | Status |
|---------|--------|
| TLS everywhere | ✅ Aktif (Vercel) |
| Password hashing | ✅ Aktif |
| RBAC admin | ✅ Aktif |
| PII masking admin | 🔄 Sebagian |
| Field encryption KYC | 🔄 Direncanakan |
| MFA admin | 📋 Roadmap |
| Penetration test | 📋 Pre-launch |

## Insiden & Respons

Jika terjadi kebocoran data, kami akan:
1. Contain & assess dalam 24 jam
2. Notify otoritas sesuai UU PDP (3×24 jam)
3. Notify pengguna terdampak
4. Post-mortem & perbaikan

Detail: [Pelaporan Kerentanan](/kepercayaan/pelaporan).

## Infrastruktur & Vendor

| Layer | Penyedia | Catatan |
|-------|----------|---------|
| Hosting & CDN | Vercel | Edge TLS, DDoS mitigation dasar |
| Database | PostgreSQL (Neon/cloud) | Enkripsi at-rest oleh provider |
| Auth OAuth | Google | Scope minimal |
| Video (rencana) | Bunny.net / Mux | Signed URLs, enrollment-gated |

Detail vendor: [Sub-prosesor](/privasi/sub-prosesor).

## Kontak

Keamanan: [security@bursanalar.com](mailto:security@bursanalar.com)
