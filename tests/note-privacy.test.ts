import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildReviewPdfLines } from "../src/lib/note/review-pdf";
import { formatPnl } from "../src/lib/note/stats";
import { parseNotePrefs } from "../src/lib/note/prefs";

describe("privacy mode", () => {
  it("masks every monetary value", () => {
    assert.equal(formatPnl(123456, { masked: true }), "•••");
    assert.equal(formatPnl(-50, { masked: true }), "•••");
    assert.equal(formatPnl(null, { masked: true }), "-");
  });

  it("parses the privacy flag with safe default off", () => {
    assert.equal(parseNotePrefs({}).privacyMode, false);
    assert.equal(parseNotePrefs({ privacyMode: true }).privacyMode, true);
    assert.equal(parseNotePrefs({ privacyMode: "yes" }).privacyMode, false);
  });
});

describe("review pdf lines", () => {
  it("builds a complete bilingual summary", () => {
    const lines = buildReviewPdfLines({
      locale: "en",
      generatedAt: "2026-09-22T10:00:00.000Z",
      weekNet: "+$100",
      weekMeta: "5 close · 60% win",
      monthNet: "+$300",
      monthMeta: "20 close · 55% win",
      mistake: "No dominant mistake pattern.",
      adherence: "Followed +$200 · Broken -$50",
      edge: "Your edge: asian EURUSD.",
    });
    const text = lines.join("\n");
    assert.ok(text.includes("Bursa Note — Trading Review"));
    assert.ok(text.includes("Last 7 days"));
    assert.ok(text.includes("Adherence vs outcome"));
    assert.ok(!text.includes("undefined"));
  });
});
