# Bursa ? Platform Edukasi Trading (Next.js)

> **Status: PROTOTYPE LANJUTAN (P0+ selesai, P1/P2 parsial).** Frontend premium + backend parsial (Prisma, API routes, admin, chat, search). Bukan production-ready ? payment real, video hosting belum. **Google OAuth (NextAuth)** tersedia untuk login/daftar; sesi client localStorage masih dipakai sebagai bridge prototype.

?? **Dokumentasi lengkap:** [`../Documentation/00 - Overview & Peta Dokumentasi.md`](../Documentation/00%20-%20Overview%20%26%20Peta%20Dokumentasi.md)  
?? **Status implementasi terkini:** [`../Documentation/16 - Engineer Onboarding Guide/15 - Status Implementasi Kode (Living Doc).md`](../Documentation/16%20-%20Engineer%20Onboarding%20Guide/15%20-%20Status%20Implementasi%20Kode%20(Living%20Doc).md)

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

1. Buat database gratis di [Neon](https://neon.tech) ? **New Project**
2. Salin **Pooled connection** dan **Direct connection** dari dashboard Neon
3. Salin `.env.example` ke `.env` dan isi:

```bash
DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://...@ep-xxx....neon.tech/neondb?sslmode=require"
```

4. Jalankan:

```bash
npm install
npm run db:deploy   # pertama kali ? apply migrations ke Neon
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
| `/kelas/[slug]` | Detail course + hero cinematic + curriculum cards |
| `/panduan-belajar` | Kuis 8 pertanyaan ? rekomendasi kelas/mentor |
| `/jadi-mentor` | Formulir aplikasi mentor (+ email admin Resend) |
| `/belajar/...` | Video protected + catatan sidebar kanan |
| `/checkout/...` | Mock checkout (komisi 25%) |
| `/dashboard` | Dashboard user |
| `/admin` | Panel admin (DB-backed) |
| `/masuk`, `/daftar` | Auth (email/password + Google OAuth) |

---

## Login dengan Google (NextAuth)

Tombol **Lanjutkan dengan Google** di `/masuk` dan `/daftar` memakai [NextAuth.js v5](https://authjs.dev) + Google OAuth. Scope minimal: **email** dan **profil publik** (nama, foto) ? tanpa akses Gmail.

### Environment variables

Salin dari `.env.example`:

| Variable | Keterangan |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth Client ID dari Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL publik tanpa trailing slash (mis. `http://localhost:3000`) |

Build **tetap jalan** tanpa variabel Google ? tombol menampilkan petunjuk konfigurasi.

### Konfigurasi Google Cloud Console (admin)

1. Buka [Google Cloud Console](https://console.cloud.google.com/) ? pilih/buat project
2. **APIs & Services** ? **OAuth consent screen**
   - User type: **External** (testing) atau Internal (Workspace)
   - Isi app name (Bursa), support email, logo opsional
   - Scopes: cukup default `email`, `profile`, `openid` ? **jangan** tambah Gmail/Drive
   - Tambahkan domain produksi di **Authorized domains** (mis. `bursa-website.vercel.app`)
3. **Credentials** ? **Create credentials** ? **OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (dev)
     - `https://bursa-website.vercel.app` (production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://bursa-website.vercel.app/api/auth/callback/google`
4. Salin **Client ID** dan **Client secret** ke Vercel env vars + `.env` lokal
5. Redeploy setelah env vars disimpan

### Alur teknis (prototype)

1. User klik Google ? NextAuth redirect ke Google consent
2. Callback `/api/auth/callback/google` ? upsert user di Prisma (email, nama, avatar)
3. Redirect ke `/masuk?oauth=sync` ? bridge ke localStorage session (kompatibel API existing)
4. Kebijakan privasi: link di form + consent screen Google

Privasi & keamanan: lihat `Documentation/18 - Cybersecurity, Privasi Data & Kepatuhan IT/`.

---

## Email transaksional (Resend)

Notifikasi **aplikasi mentor baru** ke admin (HTML + lampiran PDF). Env-gated ? tanpa `RESEND_API_KEY`, submit formulir tetap sukses; email tidak terkirim.

| Variable | Keterangan |
|---|---|
| `RESEND_API_KEY` | API key dari [Resend](https://resend.com) |
| `EMAIL_FROM` | From address terverifikasi (default: `Bursa <onboarding@resend.dev>`) |
| `MENTOR_APPLICATION_ADMIN_EMAIL` | Penerima admin (default: `admin.kitty033@passinbox.com`) |
| `MENTOR_APPLICATION_EMAIL_ENABLED` | Set `false` untuk nonaktifkan tanpa hapus key |

Kode: `src/lib/email/*`, `src/lib/mentor-program/application-notification.ts`

---

## Cloudflare Turnstile (anti-spam waitlist)

Widget Turnstile muncul di `/waitlist` saat **kedua** env var di bawah diset. Verifikasi token dilakukan server-side di `POST /api/waitlist`.

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **Site key** (public) ? tampil di browser |
| `TURNSTILE_SECRET_KEY` | **Secret key** (server only) ? jangan expose ke client |

### Setup production (gratis)

1. Login [Cloudflare Dashboard](https://dash.cloudflare.com/) ? **Turnstile**
2. **Add widget**
   - Widget name: `Bursa Waitlist`
   - Widget mode: **Managed** (recommended)
   - Domains: `localhost`, `bursa-website.vercel.app`, dan domain custom kamu
3. Salin **Site Key** ? `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Salin **Secret Key** ? `TURNSTILE_SECRET_KEY`
5. Set di `.env` lokal **dan** Vercel ? Environment Variables ? **Production + Preview**
6. Redeploy Vercel (`NEXT_PUBLIC_*` butuh rebuild)

### Test keys (development only)

Dummy keys Cloudflare yang **selalu lolos** ? sudah di `.env` lokal:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

Jangan pakai test keys di production. Kosongkan kedua var untuk menonaktifkan Turnstile.

Kode: `src/lib/turnstile/*`, `src/components/turnstile-widget.tsx`

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
- Data admin panel dari database ? bukan hanya mock file

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

1. Buka https://neon.tech ? sign up ? **New Project** (mis. `bursa`)
2. Di **Connection details**, salin:
   - **Pooled connection** ? untuk `DATABASE_URL`
   - **Direct connection** ? untuk `DIRECT_URL`

Format contoh:

```text
DATABASE_URL=postgresql://neondb_owner:SECRET@ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:SECRET@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Environment variables di Vercel

Vercel ? project **bursa-website** ? **Settings** ? **Environment Variables** ? **Production** (dan Preview jika perlu):

| Name | Value |
|---|---|
| `DATABASE_URL` | Pooled connection string dari Neon |
| `DIRECT_URL` | Direct connection string dari Neon |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXTAUTH_SECRET` | Random secret untuk session JWT |
| `NEXTAUTH_URL` | `https://bursa-website.vercel.app` (Production) |
| `RESEND_API_KEY` | Resend API key (email aplikasi mentor) |
| `EMAIL_FROM` | From address Resend terverifikasi |
| `MENTOR_APPLICATION_ADMIN_EMAIL` | Opsional ? override penerima admin |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (waitlist) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (server only) |

Untuk Google OAuth, tambahkan redirect URI `https://bursa-website.vercel.app/api/auth/callback/google` di Google Cloud Console (lihat bagian Login dengan Google di atas).

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

### 5. Commit message vs isi deploy

Dashboard Vercel menampilkan **pesan commit Git terakhir yang terhubung ke deploy** (biasanya commit terakhir di branch yang di-push). Deploy lewat `npx vercel deploy --prod` meng-upload **working tree lokal**; jika belum commit/push, production bisa berisi kode baru sementara dashboard masih menampilkan commit lama (misalnya pesan legal portal).

**Workflow disarankan:**

1. `git status` ? review perubahan
2. Commit dengan pesan yang menjelaskan perubahan sebenarnya
3. `git push origin master`
4. Biarkan Vercel auto-deploy dari GitHub, **atau** jalankan CLI deploy **setelah** push agar metadata commit selaras

Jangan deploy production hanya dari perubahan uncommitted jika Anda ingin riwayat Git dan label deploy Vercel akurat.


---

## Struktur Folder (Ringkas)

```
src/
??? app/           # Pages + API routes
??? components/    # UI, chat, admin, search, video
??? lib/           # db, search, chat, video, admin, auth, mock-data
prisma/            # schema, migrations, seed
```

---

## Belum Production-Ready

- Session server-side penuh (localStorage bridge masih dipakai setelah Google login)
- Midtrans payment + webhooks
- Bunny.net / Mux video hosting
- WebSocket real-time chat (saat ini polling)
- Mentor dashboard (`/instruktur-dashboard`)

Lihat living doc untuk roadmap detail.
