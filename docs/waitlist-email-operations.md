# Waitlist Email Operations

## Ownership dan approval

- Founder/Product menyetujui tujuan, CTA, milestone, tanggal, dan klaim sebelum publish.
- Legal/Privacy meninjau perubahan consent, kategori pemrosesan, retention, atau sub-prosesor.
- Engineering menjaga template, automation, preference center, webhook, suppression, dan rollout.
- Ops memantau reply-to, delivery health, batas kontak, serta eskalasi incident.
- Dilarang memakai janji profit, scarcity palsu, testimoni yang tidak dapat dibuktikan, atau reward berbasis deposit/volume trading.

## Mailbox manusia vs Resend

- **Resend** = From otomatis (`WAITLIST_EMAIL_FROM`, biasanya `belajar@bursanalar.com`).
- **Reply-To** produksi = `support@bursanalar.com` (group Zoho Path A), bukan Gmail pribadi dan bukan `esakaisar@` untuk blast.
- Surat founder = Zoho webmail, From native `esakaisar@` / Send as `support@`.
- SSOT operator: `Documentation/04 - Engineering/03 - As-Built Reference/deployment/email-webmail-zoho.md`.
- Jangan set `WAITLIST_REPLY_TO` ke `support@` di Vercel sebelum inbound group itu lulus tes.

## Cadence

- Email 0: confirmation langsung; transactional lifecycle, tidak dihitung sebagai marketing cap.
- Email 1: D+2 risk checklist.
- Email 2: D+6 product preview dan satu pertanyaan segmentasi.
- Email 3: D+12 founder story.
- Setelah onboarding: maksimal satu email bernilai per minggu, dua marketing email per tujuh hari, dan satu per 24 jam.
- Jika tidak ada materi substansial, lewati weekly email dan kirim build update bulanan.
- Referral hanya boleh dipromosikan kepada kontak yang sudah memiliki `engagedAt`.

## Launch policy

- Automation launch selalu `disabled` sampai tanggal peluncuran nyata disetujui Founder.
- Urutan: T−14 announcement, T−7 demo/bukti nyata, T−2 FAQ, T0 akses, T+1 engaged non-converter.
- Final reminder hanya boleh dikirim jika deadline atau capacity benar-benar ada dan dapat diverifikasi.
- Kontak `CONVERTED`, `UNSUBSCRIBED`, atau `SUPPRESSED` tidak boleh menerima launch reminder.

## Launch mode (confirmation only)

Production launch default — **tanpa persetujuan founder**:

| Env | Value |
|---|---|
| `EMAIL_ALLOWED_CATEGORIES` | `waitlist_confirmation,auth_verification,auth_password_reset` |
| `WAITLIST_LIFECYCLE_ENABLED` | `false` |
| `WAITLIST_LIFECYCLE_APPROVED` | `false` |
| `AUTH_WELCOME_EMAIL_ENABLED` | `false` |
| `MENTOR_APPLICATION_EMAIL_ENABLED` | `false` |

Resend automation onboarding **Disabled** di dashboard. Signup waitlist hanya kirim email konfirmasi.

Setelah founder approve di `/admin/waitlist` **dan** enable automation manual di Resend, naikkan env lifecycle bertahap.

## Preview catalog (post-purge / pre-launch demo)

Katalog publik (mentor, kelas, playlist kurasi) dan demo iPad di beranda membutuhkan data di Neon. **Jangan** jalankan `npm run db:seed` di production — script itu destructive (menghapus semua user termasuk admin founder).

Gunakan seed additive:

```powershell
cd Website
$env:CONFIRM_PREVIEW_CATALOG_SEED="true"
npm run seed:preview-catalog
```

- Upsert 10 mentor + 17 kelas + 7 playlist dari `src/lib/mock-data.ts`
- Akun mentor: `preview-mentor-{slug}@preview.bursanalar.com` dengan password random (tidak didistribusi)
- Admin founder dan entri waitlist **tidak** disentuh
- Video preview lesson memakai fallback demo MP4 (playback-token) — tidak perlu CDN khusus
- Idempotent: aman di-run ulang setelah deploy

Asset beranda: `public/mockups/ipad-pro-scene.png` (generate: `node scripts/process-ipad-scene.mjs`).

Verifikasi setelah seed + deploy (cache beranda revalidate ≤60s):

1. `/` — section `#belajar-dimana-saja` (scroll demo iPad) tampil
2. `/katalog` — kelas & mentor cards
3. `/kelas/[slug]` — curriculum + preview gratis playable
4. Halaman playlist kurasi — 7 koleksi

**Jangan** restore akun dev (`@test.dev`, `password123`). Purge script sengaja tidak menyentuh `@preview.bursanalar.com`.

## Rollout

1. Set `WAITLIST_LIFECYCLE_ENABLED=true`, rollout `0`, dan isi `WAITLIST_INTERNAL_COHORT`.
2. Validasi internal: Gmail inbox/spam, mobile, dark mode, CTA, reply-to, unsubscribe, webhook, bounce/suppression.
3. Naikkan `WAITLIST_LIFECYCLE_ROLLOUT_PERCENT` ke `10`, lalu `50`, lalu `100` setelah minimal satu cohort window sehat.
4. Jangan mengubah automation yang enabled. Disable, update graph, validasi ulang, lalu enable.
5. Rollback: set `WAITLIST_LIFECYCLE_ENABLED=false` dan rollout `0`. Confirmation-only tetap berjalan.

## Health dan guardrail

- KPI utama: unique click, reply, lesson/survey completion, account/enrollment conversion, referral quality.
- Open rate hanya indikator sekunder karena privacy proxy dan image blocking.
- Target complaint Gmail `<0,1%`; hentikan campaign sebelum `0,3%`.
- Hentikan rollout bila bounce, complaint, sync failure, atau unsubscribe melonjak di atas baseline.
- Webhook bersifat at-least-once; `svix-id` wajib didedupe. Event order tidak dijamin.

## Incident response

1. Aktifkan kill switch.
2. Disable automation terkait di Resend.
3. Periksa `/admin/waitlist`, Vercel logs, dan Resend webhook deliveries.
4. Jangan retry event enrollment dengan status provider tidak pasti sebelum memastikan run tidak pernah dibuat.
5. Suppress complaint/bounce segera; jangan reactivate melalui duplicate signup.
6. Catat timeline, dampak, root cause, dan syarat rollout ulang.

## Resend Free tier

- Alert `800`: siapkan forecast dan keputusan upgrade.
- Alert `950`: hentikan akuisisi berbayar atau upgrade sebelum melewati batas.
- `1000+`: jangan mengandalkan automation baru sampai kapasitas dikonfirmasi.
- Full-access setup key hanya dipakai lokal untuk provisioning dan langsung direvoke. Runtime memakai key terbatas.

