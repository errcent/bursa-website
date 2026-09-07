# Bursa Lab — Archived

**Archived:** 2026-09-07  
**Reason:** Calculators not yet at professional/finance-grade standard for public launch.

## What was archived

| Path | Description |
|---|---|
| `src/app/lab/` | Lab hub + `[toolId]` tool pages |
| `src/app/wave-lab/` | Experimental wave lab (if present) |
| `src/components/lab/` | Lab UI components |
| `src/lib/lab/` | Tool registry and component map |

## How it stays disabled

1. **Feature flag:** `NEXT_PUBLIC_LAB_ENABLED` unset/`false` (default)
2. **Config:** `src/lib/features/lab.ts`
3. **Proxy:** `src/proxy.ts` — 404 for `/lab*` and `/wave-lab*` when disabled
4. **Nav:** Lab link removed from navbar

## Restore

Set `NEXT_PUBLIC_LAB_ENABLED=true`, copy mirror paths back to live `src/`, restore navbar link.
