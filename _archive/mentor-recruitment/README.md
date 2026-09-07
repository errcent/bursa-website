# Mentor Recruitment (L1 public apply) — Archived

**Archived:** 2026-09-07  
**Reason:** Founder directive — no public self-apply mentor recruitment; rekrutmen hanya internal/invite.

## What was archived

Mirror under this folder (paths relative to `Website/`):

| Path | Description |
|---|---|
| `src/app/jadi-mentor/page.tsx` | Public "Jadi Mentor" landing |
| `src/app/jadi-mentor/sukses/` | Post-L1 confirmation |
| `src/components/mentor-program/mentor-application-form.tsx` | L1 open application form |
| `src/components/mentor-program/mentor-*-section.tsx` | Public info sections |
| `src/app/api/mentor/applications/route.ts` | L1 POST API |
| `src/app/api/mentor/applications/upload/route.ts` | L1 upload API |

## Still live

- `/jadi-mentor/lanjut/[token]` — private L2 invite portal (admin-generated links)
- `src/components/mentor-program/mentor-l2-application-form.tsx`
- `src/app/api/mentor/applications/l2/[token]/`
- Admin: `/admin/mentor-applications`
- `src/lib/mentor-program/**`

## How it stays disabled

1. **Feature flag:** `NEXT_PUBLIC_MENTOR_RECRUITMENT_ENABLED` unset/`false` (default)
2. **Config:** `src/lib/features/mentor-recruitment.ts`
3. **Proxy:** `src/proxy.ts` — 404 for L1 pages/API when disabled
4. **Nav:** "Jadi Mentor" removed from footer

## Restore

Set `NEXT_PUBLIC_MENTOR_RECRUITMENT_ENABLED=true`, copy mirror paths back to live `src/`, restore footer link.
