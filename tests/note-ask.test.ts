import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { answerAsk } from "../src/lib/note/ask/answer";
import { redactPII, truncateText } from "../src/lib/note/ask/redact";
import { citeTrade, inAskScope, keywordScore, retrieveKeyword } from "../src/lib/note/ask/retrieve";
import type { JournalEntry } from "../src/lib/note/types";

let seq = 0;
function entry(partial: Partial<JournalEntry>): JournalEntry {
  seq += 1;
  const pnl = partial.pnl ?? 0;
  return {
    id: `q${seq}`,
    apexUserId: "u1",
    kind: "TRADE",
    mode: "cepat",
    symbol: "EURUSD",
    side: "BUY",
    qty: 1,
    entryPrice: 1,
    exitPrice: 1,
    fees: 0,
    pnl,
    result: pnl > 0 ? "win" : pnl < 0 ? "loss" : "be",
    emotion: null,
    note: null,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: "2026-09-10T10:00:00.000Z",
    createdAt: "2026-09-10T10:00:00.000Z",
    ...partial,
  };
}

const fmt = { compact: false, decimals: 0, currency: "USD" as const, locale: "en" as const };

describe("ask retrieval", () => {
  it("scopes by symbol, session, and date", () => {
    const e = entry({ symbol: "XAUUSD", session: "ny", openedAt: "2026-09-12T10:00:00.000Z" });
    assert.equal(inAskScope(e, { symbols: ["XAUUSD"] }), true);
    assert.equal(inAskScope(e, { symbols: ["EURUSD"] }), false);
    assert.equal(inAskScope(e, { sessions: ["ny"] }), true);
    assert.equal(inAskScope(e, { sessions: ["asian"] }), false);
    assert.equal(inAskScope(e, { from: "2026-09-13" }), false);
    assert.equal(inAskScope(e, { to: "2026-09-12" }), true);
  });

  it("scores keyword relevance and cites trades", () => {
    const e = entry({ symbol: "EURUSD", thesis: "london breakout", actualRR: 2.1 });
    assert.ok(keywordScore("london breakout thesis", e) > 0.5);
    assert.equal(keywordScore("unrelated zebra waffles", e), 0);
    assert.equal(citeTrade(e), "2026-09-10, EURUSD london, +2.1R");
  });

  it("retrieves top-k within scope", () => {
    const entries = [
      entry({ symbol: "EURUSD", note: "clean breakout" }),
      entry({ symbol: "XAUUSD", note: "choppy mess" }),
    ];
    const found = retrieveKeyword(entries, "breakout", {}, 5);
    assert.equal(found.length, 1);
    assert.equal(found[0]!.entry.symbol, "EURUSD");
  });
});

describe("ask redaction", () => {
  it("scrubs emails, urls, phones, long digits", () => {
    const out = redactPII("mail me at a@b.com or +62 812 3456 7890, see https://x.com/y, acct 123456789012");
    assert.ok(!out.includes("a@b.com"));
    assert.ok(!out.includes("https://"));
    assert.ok(!out.includes("123456789012"));
  });

  it("truncates without breaking words badly", () => {
    assert.equal(truncateText("short", 100), "short");
    assert.ok(truncateText("alpha beta gamma delta", 12).endsWith("…"));
  });
});

describe("ask answers", () => {
  const entries = [
    entry({ symbol: "EURUSD", pnl: 50 }),
    entry({ symbol: "EURUSD", pnl: 30 }),
    entry({ symbol: "XAUUSD", pnl: -20 }),
  ];

  it("answers win rate with counts", () => {
    const a = answerAsk(entries, "what is my win rate?", {}, "en", fmt);
    assert.equal(a.intent, "winrate");
    assert.match(a.text, /67%/);
  });

  it("answers best-worst per symbol", () => {
    const a = answerAsk(entries, "simbol terbaik dan terburuk?", {}, "id", fmt);
    assert.equal(a.intent, "best-worst");
    assert.match(a.text, /EURUSD/);
    assert.match(a.text, /XAUUSD/);
  });

  it("respects scope filters", () => {
    const a = answerAsk(entries, "berapa total pnl?", { symbols: ["XAUUSD"] }, "id", fmt);
    assert.match(a.text, /20/);
    assert.match(a.text, /1 trade/);
  });

  it("helps when it cannot match", () => {
    const a = answerAsk(entries, "halo apa kabar", {}, "id", fmt);
    assert.equal(a.intent, "help");
  });
});
