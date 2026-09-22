"use client";

import { useEffect, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Clone last trade button (v3 P0).
 *
 * Repeat-setup friction = the 80% case for active traders.
 * "I trade the same ICT setup every London open."
 * One click → pre-fill entry form with last trade's symbol/side/qty/SL/TP.
 *
 * Navigates to /note/baru with query params to pre-fill.
 */

const CLONE_KEY = "note-last-trade-v1";

interface LastTradeSnapshot {
  symbol: string;
  side: string;
  qty: number | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  accountLabel: string | null;
}

function loadLastTrade(): LastTradeSnapshot | null {
  try {
    const raw = localStorage.getItem(CLONE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastTradeSnapshot;
  } catch {
    return null;
  }
}

function saveLastTrade(entry: LastTradeSnapshot) {
  try {
    localStorage.setItem(CLONE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

export function CloneLastTradeButton() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [lastTrade, setLastTrade] = useState<LastTradeSnapshot | null>(null);

  useEffect(() => {
    setLastTrade(loadLastTrade());
    // Also save latest trade from journal
    if (journal.data?.entries?.length) {
      const trades = journal.data.entries.filter((e) => isPnlKind(e.kind));
      const latest = trades[trades.length - 1];
      if (latest) {
        const snap: LastTradeSnapshot = {
          symbol: latest.symbol,
          side: latest.side,
          qty: latest.qty,
          entryPrice: latest.entryPrice,
          stopLoss: latest.stopLoss ?? null,
          takeProfit: latest.takeProfit ?? null,
          accountLabel: latest.accountLabel,
        };
        saveLastTrade(snap);
        setLastTrade(snap);
      }
    }
  }, [journal.data]);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  if (!lastTrade || !lastTrade.symbol) return null;

  function clone() {
    if (!lastTrade || !lastTrade.symbol) return;
    const params = new URLSearchParams({
      symbol: lastTrade.symbol,
      side: lastTrade.side,
    });
    if (lastTrade.qty != null) params.set("qty", String(lastTrade.qty));
    if (lastTrade.entryPrice != null) params.set("entry", String(lastTrade.entryPrice));
    if (lastTrade.stopLoss != null) params.set("sl", String(lastTrade.stopLoss));
    if (lastTrade.takeProfit != null) params.set("tp", String(lastTrade.takeProfit));
    if (lastTrade.accountLabel) params.set("acct", lastTrade.accountLabel);
    window.location.href = `/note/baru?${params.toString()}`;
  }

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs font-medium",
        "text-zinc-200 hover:bg-zinc-800"
      )}
      onClick={clone}
      aria-label={t("Clone trade terakhir", "Clone last trade")}
    >
      <span className="text-sm">⧉</span>
      {t("Clone", "Clone")} {lastTrade.symbol}
    </button>
  );
}
