import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseJournalCsv } from "../src/lib/note/csv";

describe("Note CSV import", () => {
  it("maps ticker/profit aliases into Cepat entries", () => {
    const csv = "ticker,side,profit,date\nBBCA,BUY,150,2026-09-01\n";
    const { entries, errors } = parseJournalCsv(csv);
    assert.equal(errors.length, 0);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].symbol, "BBCA");
    assert.equal(entries[0].mode, "cepat");
    assert.equal(entries[0].pnl, 150);
    assert.equal(entries[0].result, "win");
  });

  it("rejects CSV without a symbol header", () => {
    const { entries, errors } = parseJournalCsv("pnl,side\n10,BUY\n");
    assert.equal(entries.length, 0);
    assert.match(errors[0] ?? "", /symbol/i);
  });
});
