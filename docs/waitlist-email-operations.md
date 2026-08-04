# Waitlist Email Operations

## Ownership dan approval

- Founder/Product menyetujui tujuan, CTA, milestone, tanggal, dan klaim sebelum publish.
- Legal/Privacy meninjau perubahan consent, kategori pemrosesan, retention, atau sub-prosesor.
- Engineering menjaga template, automation, preference center, webhook, suppression, dan rollout.
- Ops memantau reply-to, delivery health, batas kontak, serta eskalasi incident.
- Dilarang memakai janji profit, scarcity palsu, testimoni yang tidak dapat dibuktikan, atau reward berbasis deposit/volume trading.

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

