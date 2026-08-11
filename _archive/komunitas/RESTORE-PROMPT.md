# Restore Komunitas Feature — AI Prompt

Copy everything below into a new Cursor agent session to restore the komunitas (chat/community) feature.

---

## Task: Restore Komunitas (chat/community) feature

**Context:** Komunitas was soft-archived 2026-07-14, then **physically removed from live `src/`** on 2026-08-11 (mirror refreshed under `Website/_archive/komunitas/`). Prisma schema was **not** changed — only UI/API surface was removed. `/api/ai/chat` is unrelated and must stay.

### Step 1 — Copy mirror back into live `Website/`

Copy these paths from `_archive/komunitas/` → live (overwrite if stubs exist):

- `src/app/komunitas/` (+ `[roomSlug]`)
- `src/app/admin/chat-rooms/`
- `src/app/admin/branch-change-requests/`
- `src/app/mentor/chat/` (include `layout.tsx`)
- `src/app/api/chat/**`
- `src/app/api/trading/**` (signals, polls, vote)
- `src/app/api/admin/chat-rooms/**`
- `src/app/api/admin/collaboration-chat/`
- `src/app/api/admin/branch-change-requests/**`
- `src/app/api/mentor/collaboration-chat/`
- `src/app/api/mentor/chat-rooms/`
- `src/app/api/mentor/branch-change-requests/`
- `src/components/chat/**`
- `src/lib/chat/**` (includes `resolve-viewer.ts`)
- `src/lib/mentor/collaboration-chat.ts`
- `src/components/mentor/staff-chat-panel.tsx`
- `scripts/heal-hub-memberships.ts` (optional ops script)

### Step 2 — Enable feature flag

In `.env` / Vercel env vars:
```
NEXT_PUBLIC_KOMUNITAS_ENABLED=true
```

Confirm `src/lib/features/komunitas.ts` and `src/proxy.ts` still list API/page prefixes. With flag true, proxy must pass through komunitas APIs.

### Step 3 — Re-wire shared live files

Restore komunitas visibility / helpers in:

| File | Change |
|---|---|
| `src/components/site-navbar.tsx` | Show "Komunitas" nav link when `KOMUNITAS_ENABLED` |
| `src/components/admin/admin-sidebar.tsx` | Show "Chat Room" + "Usulan Cabang" links |
| `src/components/mentor/mentor-sidebar.tsx` | Show "Group Chat" link when enabled |
| `src/components/mentor/mentor-layout-shell.tsx` | Mobile "Group Chat" link (gate with flag) |
| `src/app/admin/page.tsx` | Show "Buat Chat Room" quick action |
| `src/app/mentor/page.tsx` | Show "Group Chat" button + room stats |
| `src/components/checkout-form.tsx` | Show "Buka Komunitas" post-checkout |
| `src/components/checkout-success-client.tsx` | Show komunitas CTA + copy |
| `src/components/help-center/help-center-content.tsx` | Show komunitas FAQ/CTA when enabled |
| `src/lib/search/seo.ts` | Include `/komunitas` in sitemap when enabled |
| `src/lib/admin/api.ts` / `src/lib/mentor/api.ts` | Restore chat/collab client helpers |
| `src/app/api/courses/[courseSlug]/enroll/route.ts` | Restore `ensureHubMembershipForCourseEnrollment` when enabled |
| `src/app/api/me/learning/route.ts` | Restore `healHubMembershipsForUserEnrollments` when enabled |
| Developer docs pages | Document chat routes as restored |

### Step 4 — Verify

```bash
cd Website
npm run build
```

Manual smoke:
1. `/komunitas` — hub loads with room list
2. `/komunitas/[roomSlug]` — chat room opens
3. `/admin/chat-rooms` — admin CRUD works
4. `/mentor/chat` — mentor collaboration panel loads
5. Enroll in course → hub membership created when flag on
6. POST `/api/chat/rooms` — auth guards working (fix related QC security items first)

### Env dependencies

- `DATABASE_URL` — ChatRoom, ChatMessage, ChatRoomMember models in Prisma
- No separate chat service — SSE via `/api/chat/rooms/[roomId]/stream`

### Do NOT

- Run prisma migrate reset / drop Chat* tables
- Delete `_archive/komunitas/` until restore verified in production
- Remove `/api/ai/chat` (different product)

---
