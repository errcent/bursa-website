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
| Database | Prisma 6 + PostgreSQL (Neon) |
| Validasi | Zod |
| Animasi | motion |

---

## Cara Menjalankan (lokal)

1. Buat database gratis di [Neon](https://neon.tech) → **New Project**
2. Salin **Pooled connection** dan **Direct connection** dari dashboard Neon
3. Salin `.env.example` ke `.env` dan isi:

```bash
DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx....neon.tech/neondb?sslmode=require"
```

4. Jalankan:

```bash
npm install
npm run db:deploy   # pertama kali — apply migrations ke Neon
npm run db:seed     # data demo + akun test
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
npm run build        # Production build (generate + migrate deploy + next build)
npm run db:migrate   # Buat migration baru saat develop
npm run db:deploy    # Apply migrations (Vercel build / production)
npm run db:seed      # Seed data demo
npm run db:studio    # Prisma Studio GUI
npm run lint         # ESLint
```

---

## Deploy ke Vercel

SQLite **tidak** bisa dipakai di Vercel (filesystem ephemeral). Pakai **Neon PostgreSQL** (gratis).

### 1. Database Neon

1. Buka https://neon.tech → sign up → **New Project** (mis. `bursa`)
2. Di **Connection details**, salin:
   - **Pooled connection** → untuk `DATABASE_URL`
   - **Direct connection** → untuk `DIRECT_URL`

Format contoh:

```text
DATABASE_URL=postgresql://neondb_owner:SECRET@ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:SECRET@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Environment variables di Vercel

Vercel → project **bursa-website** → **Settings** → **Environment Variables** → **Production** (dan Preview jika perlu):

| Name | Value |
|---|---|
| `DATABASE_URL` | Pooled connection string dari Neon |
| `DIRECT_URL` | Direct connection string dari Neon |

Tidak perlu env lain untuk error `DATABASE_URL` ini.

### 3. Migrate & seed

- **Migrate:** otomatis saat build (`prisma migrate deploy` di script `npm run build`). Set env vars **sebelum** redeploy.
- **Seed (sekali):** setelah deploy pertama sukses, dari laptop (dengan `.env` production Neon):

```bash
npm run db:seed
```

Ini mengisi akun demo (`learner@test.dev`, dll.) dan data katalog.

### 4. Redeploy

Push ke `master` atau klik **Redeploy** di Vercel setelah env vars disimpan.

Site: https://bursa-website.vercel.app

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
- Mentor dashboard (`/instruktur-dashboard`)

Lihat living doc untuk roadmap detail.
