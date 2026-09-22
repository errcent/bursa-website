/**
 * Playbook adherence scoring (clean-room).
 *
 * At entry time the form snapshots the active setup + gate check answers
 * into the trade's `protocol` field as compact JSON. Later, adherence is
 * scored per trade and aggregated into followed-vs-broken performance:
 * do rule-following trades actually make more money?
 *
 * Followed = every critical check answered yes. Score = yes / answered.
 */

import { PLAYBOOK_CHECKS } from "@/lib/note/playbook/defaults";
import type { PlaybookCheckId, PlaybookPersisted } from "@/lib/note/playbook/types";
import { isPnlKind, type JournalEntry } from "@/lib/note/types";

export interface AdherenceSnapshot {
  v: 1;
  /** Active setup id (or null). */
  s: string | null;
  /** Check ids answered yes. */
  y: PlaybookCheckId[];
  /** Check ids answered no. */
  n: PlaybookCheckId[];
}

const CRITICAL: ReadonlySet<string> = new Set(
  PLAYBOOK_CHECKS.filter((c) => c.critical).map((c) => c.id),
);

/** Snapshot current playbook state for one trade. Compact by design (<400 chars). */
export function snapshotPlaybook(state: PlaybookPersisted): string {
  const yes: PlaybookCheckId[] = [];
  const no: PlaybookCheckId[] = [];
  for (const check of PLAYBOOK_CHECKS) {
    const answer = state.checkAnswers[check.id];
    if (answer === true) yes.push(check.id);
    else if (answer === false) no.push(check.id);
  }
  const snapshot: AdherenceSnapshot = { v: 1, s: state.activeSetupId, y: yes, n: no };
  return JSON.stringify(snapshot);
}

export function parseAdherenceSnapshot(protocol: string | null): AdherenceSnapshot | null {
  if (!protocol) return null;
  try {
    const parsed = JSON.parse(protocol) as Partial<AdherenceSnapshot>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.y) || !Array.isArray(parsed.n)) return null;
    return { v: 1, s: parsed.s ?? null, y: parsed.y as PlaybookCheckId[], n: parsed.n as PlaybookCheckId[] };
  } catch {
    return null;
  }
}

export interface AdherenceScore {
  score: number | null;
  followed: boolean;
  answered: number;
}

/** Score one trade. Unscored (null) when no check was answered. */
export function adherenceOf(entry: Pick<JournalEntry, "protocol">): AdherenceScore {
  const snap = parseAdherenceSnapshot(entry.protocol);
  if (!snap) return { score: null, followed: false, answered: 0 };
  const answered = snap.y.length + snap.n.length;
  if (answered === 0) return { score: null, followed: false, answered: 0 };
  const yes = new Set(snap.y);
  const followed = [...CRITICAL].every((id) => yes.has(id as PlaybookCheckId));
  return { score: snap.y.length / answered, followed, answered };
}

export interface AdherenceBucket {
  trades: number;
  net: number;
  wins: number;
  winRate: number | null;
}

export interface AdherenceSummary {
  followed: AdherenceBucket;
  broken: AdherenceBucket;
  unscored: number;
  adherenceRate: number | null;
}

const emptyBucket = (): AdherenceBucket => ({ trades: 0, net: 0, wins: 0, winRate: null });

/** Followed-vs-broken performance across closed trades. */
export function summarizeAdherence(entries: JournalEntry[]): AdherenceSummary {
  const followed = emptyBucket();
  const broken = emptyBucket();
  let unscored = 0;
  const closed = entries.filter((e) => isPnlKind(e.kind) && e.pnl != null && e.result !== "open");
  for (const entry of closed) {
    const { score, followed: ok } = adherenceOf(entry);
    if (score == null) {
      unscored += 1;
      continue;
    }
    const bucket = ok ? followed : broken;
    bucket.trades += 1;
    bucket.net += entry.pnl ?? 0;
    if ((entry.pnl ?? 0) > 0) bucket.wins += 1;
  }
  for (const bucket of [followed, broken]) {
    bucket.winRate = bucket.trades > 0 ? bucket.wins / bucket.trades : null;
  }
  const scored = followed.trades + broken.trades;
  return {
    followed,
    broken,
    unscored,
    adherenceRate: scored > 0 ? followed.trades / scored : null,
  };
}
