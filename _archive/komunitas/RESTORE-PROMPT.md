# Restore Komunitas Feature — AI Prompt

Copy everything below into a new Cursor agent session to restore the komunitas (chat/community) feature.

---

## Task: Restore Komunitas (chat/community) feature

**Context:** Komunitas was archived on 2026-07-14 to reduce bandwidth/DB load on free hosting. Full source mirrors live in `Website/_archive/komunitas/`. Prisma schema was **not** changed — only UI/API surface was disabled.

### Step 1 — Enable feature flag

In `.env` / Vercel env vars:
```
NEXT_PUBLIC_KOMUNITAS_ENABLED=true
```

### Step 2 — Verify archived paths match live code

Compare archive mirror vs live (archive is point-in-time snapshot; live may have diverged):

- `src/app/komunitas/` (+ `[roomSlug]`)
- `src/app/admin/chat-rooms/`
- `src/app/mentor/chat/`
- `src/app/api/chat/**` (11 route files)
- `src/app/api/trading/**` (signals, polls, vote)
- `src/app/api/admin/chat-rooms/**`
- `src/app/api/admin/collaboration-chat/`
- `src/app/api/admin/branch-change-requests/**`
- `src/app/api/mentor/collaboration-chat/`
- `src/app/api/mentor/chat-rooms/`
- `src/app/api/mentor/branch-change-requests/`
- `src/components/chat/**` (23 components)
- `src/lib/chat/**` (18 lib files)
- `src/lib/mentor/collaboration-chat.ts`

If live stubs diverged, restore from `_archive/komunitas/` mirror.

### Step 3 — Re-enable navigation & UI links

Restore komunitas visibility in:

| File | Change |
|---|---|
| `src/components/site-navbar.tsx` | Show "Komunitas" nav link when `KOMUNITAS_ENABLED` |
| `src/components/admin/admin-sidebar.tsx` | Show "Chat Room" + "Usulan Cabang" links |
| `src/app/admin/page.tsx` | Show "Buat Chat Room" quick action |
| `src/app/mentor/page.tsx` | Show "Group Chat" button + room stats |
| `src/components/course-detail-hero.tsx` | Show "Buka Komunitas" for enrolled users |
| `src/components/checkout-form.tsx` | Show "Buka Komunitas" post-checkout |
| `src/components/checkout-success-client.tsx` | Show komunitas CTA + copy |
| `src/components/help-center/help-center-content.tsx` | Show "Tanya di komunitas" button |
| `src/lib/search/seo.ts` | Include `/komunitas` in sitemap |
| `src/lib/help-center/content.ts` | Komunitas FAQ category visible |

All these were gated with `KOMUNITAS_ENABLED` from `@/lib/features/komunitas` — remove gates or ensure flag is true.

### Step 4 — Re-enable enrollment hub membership

In `src/app/api/courses/[courseSlug]/enroll/route.ts`:
- Restore `ensureHubMembershipForCourseEnrollment()` calls in GET and POST when komunitas enabled.

### Step 5 — Middleware

`src/middleware.ts` passes through when `KOMUNITAS_ENABLED` is true. No change needed if flag is set.

### Step 6 — Developer docs

Update `src/app/developer/docs/page.tsx` and `src/lib/developer-docs/sections.ts` — remove "archived" notices if added.

### Step 7 — Verify

```bash
cd Website
npm run build
```

Manual smoke test:
1. `/komunitas` — hub loads with room list
2. `/komunitas/[roomSlug]` — chat room opens
3. `/admin/chat-rooms` — admin CRUD works
4. `/mentor/chat` — mentor collaboration panel loads
5. Enroll in course → hub membership created
6. POST `/api/chat/rooms` — auth guards working (fix QC items in TODO first!)

### Env dependencies

- `DATABASE_URL` — ChatRoom, ChatMessage, ChatRoomMember models in Prisma
- No separate chat service — SSE via `/api/chat/rooms/[roomId]/stream`
- Optional: review QC queue TODO items QC-20260714-01 through QC-20260714-25 for security fixes before production restore

### Do NOT

- Run prisma migrate reset
- Delete `_archive/komunitas/` until restore verified in production

---
