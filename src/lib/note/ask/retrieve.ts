/**
 * Ask Your Journal — retrieval scope + keyword relevance (clean-room).
 *
 * Every answer respects an explicit scope (symbols, sessions, date range)
 * so filtered questions only see filtered trades. Keyword relevance ranks
 * candidates when no vector backend is available; the vector adapter in
 * ./vectors.ts plugs into the same interface when pgvector + an embedding
 * key exist. Deterministic first, vectors as enhancement.
 */

import { deriveSession } from "@/lib/note/edge-finder";
import { dayKey } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

export interface AskScope {
  symbols?: string[];
  sessions?: string[];
  from?: string;
  to?: string;
}

export function inAskScope(entry: JournalEntry, scope: AskScope): boolean {
  if (scope.symbols && scope.symbols.length > 0) {
    const wanted = new Set(scope.symbols.map((s) => s.toUpperCase()));
    if (!wanted.has(entry.symbol.toUpperCase())) return false;
  }
  if (scope.sessions && scope.sessions.length > 0) {
    const session = (entry.session?.trim() || deriveSession(entry.openedAt)).toLowerCase();
    const wanted = new Set(scope.sessions.map((s) => s.toLowerCase()));
    if (!wanted.has(session)) return false;
  }
  if (scope.from || scope.to) {
    const day = dayKey(entry.openedAt);
    if (scope.from && day < scope.from) return false;
    if (scope.to && day > scope.to) return false;
  }
  return true;
}

export function scopedTrades(entries: JournalEntry[], scope: AskScope): JournalEntry[] {
  return entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open" && inAskScope(e, scope));
}

const STOPWORDS = new Set([
  "apa", "yang", "dan", "di", "ke", "dari", "ini", "itu", "saya", "aku", "the",
  "a", "an", "and", "or", "of", "in", "on", "my", "is", "are", "was", "were",
  "berapa", "kenapa", "mengapa", "bagaimana", "how", "why", "what", "when",
]);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.%-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Keyword relevance 0..1 between a question and one trade's text surface. */
export function keywordScore(question: string, entry: JournalEntry): number {
  const questionWords = new Set(keywords(question));
  if (questionWords.size === 0) return 0;
  const surface = [
    entry.symbol,
    entry.side,
    entry.emotion ?? "",
    entry.note ?? "",
    entry.thesis ?? "",
    entry.lesson ?? "",
    entry.ruleBroken ?? "",
  ]
    .join(" ")
    .toLowerCase();
  let hits = 0;
  for (const word of questionWords) {
    if (surface.includes(word)) hits += 1;
  }
  return hits / questionWords.size;
}

export interface RankedTrade {
  entry: JournalEntry;
  score: number;
}

/** Top-k trades by keyword relevance within scope. */
export function retrieveKeyword(
  entries: JournalEntry[],
  question: string,
  scope: AskScope,
  k = 5,
): RankedTrade[] {
  return scopedTrades(entries, scope)
    .map((entry) => ({ entry, score: keywordScore(question, entry) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, k));
}

/** Citation tag pinned to one trade: `2026-09-20, EURUSD London, +2.1R`. */
export function citeTrade(entry: JournalEntry): string {
  const day = dayKey(entry.openedAt);
  const session = entry.session?.trim() || deriveSession(entry.openedAt);
  const r = entry.actualRR;
  const rPart = r != null && Number.isFinite(r) ? `, ${r >= 0 ? "+" : ""}${r.toFixed(1)}R` : "";
  return `${day}, ${entry.symbol} ${session}${rPart}`;
}
