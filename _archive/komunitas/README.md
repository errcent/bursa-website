# Komunitas (Chat / Community) — Archived

**Archived:** 2026-07-14 (soft-off) · **Physical mirror refreshed:** 2026-08-11  
**Reason:** Founder directive — feature too heavy for free-tier hosting (bandwidth + DB load). Hold until infrastructure can support it. Live `src/` trees were removed after this mirror sync; restore from here.

## What was archived

Mirror copies of komunitas-related source under this folder (paths relative to `Website/`):

| Path | Description |
|---|---|
| `src/app/komunitas/` | Public community hub + room pages |
| `src/app/komunitas/[roomSlug]/` | Individual chat room page |
| `src/app/admin/chat-rooms/` | Admin chat room management UI |
| `src/app/admin/branch-change-requests/` | Admin branch proposal UI |
| `src/app/mentor/chat/` | Mentor collaboration & branch chat UI (+ `layout.tsx`) |
| `src/app/api/chat/` | Chat rooms, messages, SSE stream, members, live |
| `src/app/api/trading/` | Trading signals & polls (tied to chat rooms) |
| `src/app/api/admin/chat-rooms/` | Admin chat room CRUD API |
| `src/app/api/admin/collaboration-chat/` | Admin staff collaboration chat API |
| `src/app/api/admin/branch-change-requests/` | Admin branch proposal API |
| `src/app/api/mentor/collaboration-chat/` | Mentor collaboration chat API |
| `src/app/api/mentor/chat-rooms/` | Mentor chat room API |
| `src/app/api/mentor/branch-change-requests/` | Mentor branch proposal API |
| `src/components/chat/` | All chat UI components |
| `src/lib/chat/` | Chat lib (access, db-rooms, SSE, resolve-viewer, types, etc.) |
| `src/lib/mentor/collaboration-chat.ts` | Mentor collaboration chat helpers |
| `src/components/mentor/staff-chat-panel.tsx` | Staff collaboration chat panel |
| `scripts/heal-hub-memberships.ts` | One-off hub membership heal script |

## How it stays disabled (live codebase)

1. **Feature flag:** `NEXT_PUBLIC_KOMUNITAS_ENABLED` unset/`false` (default) in `.env.example`
2. **Config:** `src/lib/features/komunitas.ts` — API/page prefix lists for proxy guards
3. **Proxy:** `src/proxy.ts` — returns 404 JSON for komunitas API prefixes when disabled; old page URLs 404 naturally (routes removed)
4. **Nav/UI:** Komunitas links removed from live nav/sidebars (restore from archive + RESTORE-PROMPT)
5. **Enrollment / learning:** Hub membership heal calls removed from live enroll + `/api/me/learning`
6. **Sitemap:** `/komunitas` omitted when disabled
7. **Prisma:** Schema/models **unchanged** — data preserved for future restore

## Keep alive (do not archive)

- `/api/ai/chat` — AI support chat (unrelated stack)
- Prisma `Chat*` / `Trading*` models and enums
- Marketing/legal copy mentioning “komunitas”
- Learning format `"community"` (pedagogy enum, not chat)

## Restore

See [`RESTORE-PROMPT.md`](./RESTORE-PROMPT.md) for a copy-paste AI prompt to re-enable the feature.
