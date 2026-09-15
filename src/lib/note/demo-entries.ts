import { isNoteOpenAccessPeriod } from "@/lib/note/open-access";
import { dayKey, NOTE_TZ, resolvedResult } from "@/lib/note/stats";
import { isPnlKind, type JournalEntry, type JournalResult } from "@/lib/note/types";

/** Local-only sample so the journal chrome can be reviewed without a session. */
export const NOTE_DEMO_USER = "local-demo";

function jakartaParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NOTE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(date).split("-").map(Number);
  return { year: y!, month: m!, day: d! };
}

function openedAtLocal(year: number, month: number, day: number, hour: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:20:00+07:00`;
}

type DemoSymbol = "EURUSD" | "XAUUSD" | "GBPUSD" | "USDJPY" | "AUDUSD";

type Seed = {
  day: number;
  hour: number;
  symbol: DemoSymbol;
  side: "BUY" | "SELL";
  pnl: number;
  result: JournalResult;
  note: string;
  ruleBroken?: string | null;
  lesson?: string | null;
};

const SYMBOLS: DemoSymbol[] = ["EURUSD", "XAUUSD", "GBPUSD", "USDJPY", "AUDUSD"];
/** Hours chosen to cover Asia / London / NY / off-session buckets in WIB. */
const SESSION_HOURS = [8, 9, 11, 14, 16, 19, 22, 23, 2] as const;

function outcomeFromHash(n: number): { pnl: number; result: JournalResult } {
  const mod = n % 11;
  if (mod === 0) return { pnl: 0, result: "be" };
  if (mod <= 6) {
    const pnl = 12 + ((mod * 7) % 55);
    return { pnl, result: "win" };
  }
  const pnl = -(8 + ((mod * 5) % 40));
  return { pnl, result: "loss" };
}

/** Ensure calendar / daily PnL is not all green - mix red and flat days. */
function balanceDayNet(day: number, daySeeds: Seed[]): void {
  if (daySeeds.length === 0) return;
  let net = daySeeds.reduce((s, x) => s + x.pnl, 0);
  const wantRed = day % 3 === 0 || day % 5 === 2;
  const wantFlat = day % 11 === 0;

  if (wantRed && net >= 0) {
    const pnl = -(net + 35 + (day % 23));
    daySeeds.push({
      day,
      hour: 21,
      symbol: SYMBOLS[day % SYMBOLS.length]!,
      side: "SELL",
      pnl,
      result: "loss",
      note: `Demo · penutupan hari ${day} (net negatif).`,
      ruleBroken: day % 6 === 0 ? "Overtrade di sesi US." : undefined,
      lesson: day % 6 === 0 ? "Max 3 setup per sesi." : undefined,
    });
    return;
  }

  if (wantFlat && net !== 0) {
    daySeeds.push({
      day,
      hour: 20,
      symbol: "EURUSD",
      side: "BUY",
      pnl: -net,
      result: "be",
      note: `Demo · hari ${day} net ~flat setelah penyesuaian.`,
    });
    return;
  }

  if (!wantRed && !wantFlat && net <= 0) {
    daySeeds.push({
      day,
      hour: 20,
      symbol: "XAUUSD",
      side: "BUY",
      pnl: -net + 28 + (day % 15),
      result: "win",
      note: `Demo · recovery hari ${day}.`,
    });
  }
}

function buildSeedGrid(todayDay: number): Seed[] {
  const seeds: Seed[] = [];
  let idx = 0;
  for (let day = 1; day <= Math.min(todayDay, 28); day++) {
    const daySeeds: Seed[] = [];
    for (const hour of SESSION_HOURS) {
      if (day === todayDay && hour > 20 && idx % 3 !== 0) continue;
      const symbol = SYMBOLS[(day + hour + idx) % SYMBOLS.length]!;
      const { pnl, result } = outcomeFromHash(day * 17 + hour * 3 + idx);
      const side: "BUY" | "SELL" = (day + hour) % 2 === 0 ? "BUY" : "SELL";
      daySeeds.push({
        day,
        hour,
        symbol,
        side,
        pnl,
        result,
        note: `Demo #${idx + 1} · ${symbol} ${side} · sesi jam ${hour} WIB.`,
        ...(result === "loss" && idx % 5 === 0
          ? { ruleBroken: "Entry sebelum konfirmasi.", lesson: "Tunggu close candle H1." }
          : {}),
      });
      idx += 1;
    }
    balanceDayNet(day, daySeeds);
    seeds.push(...daySeeds);
  }

  seeds.push(
    {
      day: Math.min(3, todayDay),
      hour: 10,
      symbol: "EURUSD",
      side: "BUY",
      pnl: 42,
      result: "win",
      note: "London open pullback, R:R 1:2.",
    },
    {
      day: Math.min(11, todayDay),
      hour: 16,
      symbol: "XAUUSD",
      side: "SELL",
      pnl: 0,
      result: "be",
      note: "Stop ke BE setelah spike CPI.",
    }
  );

  return seeds.filter((s) => s.day <= todayDay);
}

function buildCurrentMonthDemoEntries(): JournalEntry[] {
  const { year, month, day: todayDay } = jakartaParts();
  const seeds = buildSeedGrid(todayDay);

  const seen = new Set<string>();
  return seeds
    .filter((s) => {
      const key = `${s.day}-${s.hour}-${s.symbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s, i) => {
      const iso = openedAtLocal(year, month, s.day, s.hour);
      const id = `demo-${year}${String(month).padStart(2, "0")}-${String(s.day).padStart(2, "0")}-${i}`;
      const isMetal = s.symbol === "XAUUSD";
      return {
        id,
        apexUserId: NOTE_DEMO_USER,
        kind: "TRADE" as const,
        mode: i % 4 === 0 ? ("review" as const) : ("cepat" as const),
        symbol: s.symbol,
        side: s.side,
        qty: isMetal ? 0.05 : 0.1,
        entryPrice: null,
        exitPrice: null,
        fees: isMetal ? 4 : 2,
        currency: "USD" as const,
        pnl: s.pnl,
        result: s.result,
        emotion: null,
        note: s.note,
        ruleBroken: s.ruleBroken ?? null,
        lesson: s.lesson ?? null,
        clinicModuleId: null,
        protocol: null,
        accountLabel: "Demo",
        relatedCourseSlug: null,
        relatedLessonId: null,
        openedAt: iso,
        createdAt: iso,
      };
    })
    .sort((a, b) => a.openedAt.localeCompare(b.openedAt));
}

/** Regenerated for current Jakarta month (dense grid for analytics / 3D surface). */
export const NOTE_DEMO_ENTRIES: JournalEntry[] = buildCurrentMonthDemoEntries();

/** For tests: ensure demo trades sit in the same month as `dayKey(now)`. */
export function demoEntriesInCurrentMonth(now = new Date()): boolean {
  if (!NOTE_DEMO_ENTRIES.length) return false;
  const anchor = dayKey(now.toISOString());
  const ym = anchor.slice(0, 7);
  return NOTE_DEMO_ENTRIES.every((e) => dayKey(e.openedAt).startsWith(ym));
}

function isClosedTrade(entry: JournalEntry): boolean {
  return isPnlKind(entry.kind) && entry.pnl != null && resolvedResult(entry) !== "open";
}

/** During open access, merge demo until the user has a real journal density this month. */
export const DEMO_JOURNAL_REAL_MONTH_MIN_CLOSES = 5;

function closedTradesInMonth(entries: JournalEntry[], ym: string): number {
  return entries.filter(
    (e) => isClosedTrade(e) && dayKey(e.openedAt).startsWith(ym)
  ).length;
}

/** True when preview should inject forex demo (empty/sparse DB this month). */
export function shouldServeDemoJournal(entries: JournalEntry[], now = new Date()): boolean {
  if (!isNoteOpenAccessPeriod(now)) return false;
  const ym = dayKey(now.toISOString()).slice(0, 7);
  return closedTradesInMonth(entries, ym) < DEMO_JOURNAL_REAL_MONTH_MIN_CLOSES;
}

export function withDemoJournalFallback(all: JournalEntry[]): { entries: JournalEntry[]; demo: boolean } {
  if (!shouldServeDemoJournal(all)) {
    return { entries: all, demo: false };
  }
  if (all.length === 0) {
    return { entries: NOTE_DEMO_ENTRIES, demo: true };
  }
  const demoIds = new Set(NOTE_DEMO_ENTRIES.map((e) => e.id));
  return {
    entries: [...NOTE_DEMO_ENTRIES, ...all.filter((e) => !demoIds.has(e.id))],
    demo: true,
  };
}
