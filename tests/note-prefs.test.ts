import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_NOTE_PREFS, parseNotePrefs, pnlOptsFromPrefs } from "../src/lib/note/prefs";

describe("Note prefs", () => {
  it("returns defaults for empty or garbage input", () => {
    assert.deepEqual(parseNotePrefs(null), DEFAULT_NOTE_PREFS);
    assert.deepEqual(parseNotePrefs("nope"), DEFAULT_NOTE_PREFS);
    assert.equal(parseNotePrefs({}).weekStart, "sunday");
    assert.equal(parseNotePrefs({}).calendarShowNet, true);
    assert.equal(parseNotePrefs({}).locale, "id");
    assert.equal(parseNotePrefs({}).currency, "IDR");
    assert.equal(parseNotePrefs({}).theme, "dark");
  });

  it("accepts known fields and ignores unknown", () => {
    const parsed = parseNotePrefs({
      numberFormat: "full",
      heroRange: "month",
      defaultKind: "INVEST",
      weekStart: "monday",
      decimals: 2,
      lossStyle: "paren",
      colorMode: "pattern",
      density: "compact",
      emotionPrompt: "after-loss",
      calendarShowNet: false,
      locale: "en",
      currency: "USD",
      theme: "light",
      extra: true,
    });
    assert.equal(parsed.numberFormat, "full");
    assert.equal(parsed.heroRange, "month");
    assert.equal(parsed.defaultKind, "INVEST");
    assert.equal(parsed.weekStart, "monday");
    assert.equal(parsed.decimals, 2);
    assert.equal(parsed.lossStyle, "paren");
    assert.equal(parsed.colorMode, "pattern");
    assert.equal(parsed.density, "compact");
    assert.equal(parsed.emotionPrompt, "after-loss");
    assert.equal(parsed.calendarShowNet, false);
    assert.equal(parsed.locale, "en");
    assert.equal(parsed.currency, "USD");
    assert.equal(parsed.theme, "light");
    assert.equal(parsed.version, 1);
  });

  it("maps prefs to pnl format options", () => {
    const opts = pnlOptsFromPrefs({
      ...DEFAULT_NOTE_PREFS,
      numberFormat: "compact",
      decimals: 1,
      lossStyle: "paren",
    });
    assert.equal(opts.compact, true);
    assert.equal(opts.decimals, 1);
    assert.equal(opts.lossStyle, "paren");
    assert.equal(opts.currency, "IDR");
  });
});
