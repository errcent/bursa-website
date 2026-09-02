# Bursa Note — isolated Prisma schema

Production: instance **Prisma Postgres terpisah** (`bursa-note`, `ap-southeast-1`) dari DB kelas. Jangan pakai `DATABASE_URL` course. Env: `NOTE_DATABASE_URL` + `NOTE_DIRECT_URL` (TCP `postgres://` untuk Prisma 6 tanpa Accelerate).

Lokal: salin ke `.env.local` (gitignored). Generate + migrate:

```
npm run db:note:generate
npm run db:note:deploy
```

Lokal tanpa URL: API memakai `.data/note-local.json` (gitignored). Production tanpa URL = fail-closed.
Build production menjalankan `migrate-note-if-configured.mjs` hanya jika `NOTE_DATABASE_URL` ada.
