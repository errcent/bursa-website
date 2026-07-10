# Bursa — Platform Edukasi Trading (Next.js)

> **Status: PROTOTYPE LANJUTAN (P0+ selesai, P1/P2 parsial).** Frontend premium + backend parsial (Prisma, API routes, admin, chat, search). Bukan production-ready — payment real, NextAuth, dan video hosting belum.

📚 **Dokumentasi lengkap:** [`../Documentation/00 - Overview & Peta Dokumentasi.md`](../Documentation/00%20-%20Overview%20%26%20Peta%20Dokumentasi.md)  
📊 **Status implementasi terkini:** [`../Documentation/16 - Engineer Onboarding Guide/15 - Status Implementasi Kode (Living Doc).md`](../Documentation/16%20-%20Engineer%20Onboarding%20Guide/15%20-%20Status%20Implementasi%20Kode%20(Living%20Doc).md)

---

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Prisma 6 + SQLite (dev) → PostgreSQL (production) |
| Validasi | Zod |
| Animasi | motion |

---

## Cara Menjalankan

```bash
npm install
npm run db:migrate    # pertama kali
npm run db:seed       # data demo + akun test
npm run dev
```

Buka http://localhost:3000

### Akun test (password: `password123`)

| Email | Role |
|---|---|
| `learner@test.dev` | Learner |
| `mentor@test.dev` | Mentor |
| `admin@test.dev` | Admin |

---

## Halaman Utama

| Route | Fitur |
|---|---|
| `/` | Landing |
| `/katalog` | Katalog + search dropdown + filter SEO |
| `/komunitas` | Grup chat trading (anti-screenshot internal) |
| `/instruktur/[slug]` | Profil mentor |
| `/kelas/[slug]` | Detail course |
| `/belajar/...` | Video protected + notes |
| `/checkout/...` | Mock checkout (komisi 25%) |
| `/dashboard` | Dashboard user |
| `/admin` | Panel admin (DB-backed) |
| `/masuk`, `/daftar` | Auth prototype (localStorage) |

---

## Fitur Implementasi Terbaru

### Grup Chat (`/komunitas`)
- Room Internal / Pemula / Menengah / Mahir per mentor
- Anti-screenshot untuk room internal (watermark, blur, audit)
- Trading signal cards, `$TICKER` mentions, poll, pinned messages

### Proteksi Video
- Preview gratis tanpa batasan
- Video berbayar: watermark, anti-screenshot, playback token API

### Search & SEO
- Dropdown rekomendasi di navbar & katalog
- Hasil kelas + mentor + topik
- `sitemap.xml`, `robots.txt`, JSON-LD SearchAction
- Metadata dinamis per query pencarian

### Database & Admin
- Prisma schema 22 model
- Admin CRUD: mentor, course, chat room, users, moderation
- Data admin panel dari database — bukan hanya mock file

---

## Scripts

```bash
npm run dev          # Development
npm run build        # Production build
npm run db:migrate   # Migrate database
npm run db:seed      # Seed data
npm run db:studio    # Prisma Studio GUI
npm run lint         # ESLint
```

---

## Struktur Folder (Ringkas)

```
src/
├── app/           # Pages + API routes
├── components/    # UI, chat, admin, search, video
└── lib/           # db, search, chat, video, admin, auth, mock-data
prisma/            # schema, migrations, seed
```

---

## Belum Production-Ready

- NextAuth / session server-side
- Midtrans payment + webhooks
- Bunny.net / Mux video hosting
- WebSocket real-time chat (saat ini polling)
- PostgreSQL production database
- Mentor dashboard (`/instruktur-dashboard`)

Lihat living doc untuk roadmap detail.
