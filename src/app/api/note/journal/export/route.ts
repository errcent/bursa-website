import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api-utils";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import { getNoteRepo } from "@/lib/note/repo";
import { summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";

export const dynamic = "force-dynamic";

/**
 * Public read API for journal data (v3 P3).
 * GET /api/note/journal/export?format=summary|full
 *
 * - summary: PnL, win rate, count (no raw trades)
 * - full: all trades (for cross-device sync / backup)
 *
 * Requires note.read session.
 */
export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.read");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "summary";

  try {
    const repo = getNoteRepo();
    const entries = await repo.listEntries(auth.session.userId);
    const tradeEntries = entries.filter((e) => isPnlKind(e.kind));

    if (format === "full") {
      return applyNoteCors(
        jsonOk({
          version: 1,
          exportedAt: new Date().toISOString(),
          entries: tradeEntries.map((e) => ({
            symbol: e.symbol,
            side: e.side,
            qty: e.qty,
            entryPrice: e.entryPrice,
            exitPrice: e.exitPrice,
            pnl: e.pnl,
            result: e.result,
            stopLoss: e.stopLoss,
            takeProfit: e.takeProfit,
            plannedRR: e.plannedRR,
            actualRR: e.actualRR,
            thesis: e.thesis,
            session: e.session,
            accountLabel: e.accountLabel,
            openedAt: e.openedAt,
          })),
        }),
        origin
      );
    }

    // summary format
    const summary = summarizeJournal(tradeEntries);
    return applyNoteCors(
      jsonOk({
        summary: {
          totalPnl: summary.pnlSum,
          winRate: summary.winRate,
          totalTrades: summary.closedCount,
          wins: summary.wins,
          losses: summary.losses,
        },
      }),
      origin
    );
  } catch (error) {
    return applyNoteCors(jsonError("Export failed.", 500), origin);
  }
}
