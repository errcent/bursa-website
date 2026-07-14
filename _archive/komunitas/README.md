# Komunitas (Chat / Community) — Archived

**Archived:** 2026-07-14  
**Reason:** Founder directive — feature too heavy for free-tier hosting (bandwidth + DB load). Hold until infrastructure can support it.

## What was archived

Mirror copies of komunitas-related source under this folder (paths relative to `Website/`):

| Path | Description |
|---|---|
| `src/app/komunitas/` | Public community hub + room pages |
| `src/app/komunitas/[roomSlug]/` | Individual chat room page |
| `src/app/admin/chat-rooms/` | Admin chat room management UI |
| `src/app/mentor/chat/` | Mentor collaboration & branch chat UI |
| `src/app/api/chat/` | Chat rooms, messages, SSE stream, members, live |
| `src/app/api/trading/` | Trading signals & polls (tied to chat rooms) |
| `src/app/api/admin/chat-rooms/` | Admin chat room CRUD API |
| `src/app/api/admin/collaboration-chat/` | Admin staff collaboration chat API |
| `src/app/api/admin/branch-change-requests/` | Admin branch proposal API |
| `src/app/api/mentor/collaboration-chat/` | Mentor collaboration chat API |
| `src/app/api/mentor/chat-rooms/` | Mentor chat room API |
| `src/app/api/mentor/branch-change-requests/` | Mentor branch proposal API |
| `src/components/chat/` | All chat UI components (23 files) |
| `src/lib/chat/` | Chat lib (access, db-rooms, SSE, types, etc.) |
| `src/lib/mentor/collaboration-chat.ts` | Mentor collaboration chat helpers |

## How it was disabled (live codebase)

1. **Feature flag:** `NEXT_PUBLIC_KOMUNITAS_ENABLED=false` (default when unset) in `.env.example`
2. **Config:** `src/lib/features/komunitas.ts`
3. **Middleware:** `src/middleware.ts` — returns 404 for komunitas pages and API prefixes when disabled
4. **Nav/UI:** Komunitas links hidden from navbar, admin sidebar, checkout, course detail, help center, mentor dashboard
5. **Enrollment:** Hub membership creation skipped in `src/app/api/courses/[courseSlug]/enroll/route.ts` when disabled
6. **Sitemap:** `/komunitas` omitted from sitemap when disabled
7. **Prisma:** Schema/models **unchanged** — data preserved for future restore

## Restore

See [`RESTORE-PROMPT.md`](./RESTORE-PROMPT.md) for a copy-paste AI prompt to re-enable the feature.
