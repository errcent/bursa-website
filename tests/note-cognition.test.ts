import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyNoteText, tagLabel } from "../src/lib/note/cognition/tags";
import { buildBeliefPromotions, isBeliefEntry } from "../src/lib/note/cognition/promotions";
import type { JournalEntry } from "../src/lib/note/types";

function belief(partial: Partial<JournalEntry> & { note: string; openedAt: string }): JournalEntry {
  return {
    id: partial.id ?? "b1",
    apexUserId: "u",
    kind: "REFLEKSI",
    mode: "cepat",
    symbol: "NOTE",
    side: "NOTE",
    qty: null,
    entryPrice: null,
    exitPrice: null,
    fees: null,
    pnl: null,
    result: null,
    emotion: null,
    note: partial.note,
    ruleBroken: null,
    lesson: null,
    clinicModuleId: null,
    protocol: null,
    accountLabel: null,
    relatedCourseSlug: null,
    relatedLessonId: null,
    openedAt: partial.openedAt,
    createdAt: partial.openedAt,
  };
}

describe("Note belief tagging", () => {
  it("classifies trade idea and macro", () => {
    assert.ok(classifyNoteText("Planning a long entry after CPI").includes("trade_idea"));
    assert.ok(classifyNoteText("Planning a long entry after CPI").includes("macro_news"));
  });

  it("defaults to market observation", () => {
    assert.deepEqual(classifyNoteText("hmm"), ["market_observation"]);
  });

  it("labels tags", () => {
    assert.ok(tagLabel("setup_hypothesis", "en").length > 2);
  });
});

describe("Belief promotions", () => {
  it("detects belief entries", () => {
    assert.equal(isBeliefEntry(belief({ note: "x", openedAt: "2026-01-01T10:00:00+07:00" })), true);
  });

  it("promotes repeated snippets", () => {
    const entries = [
      belief({ id: "1", note: "Wait for breakout on XAU only", openedAt: "2026-03-01T10:00:00+07:00" }),
      belief({ id: "2", note: "Wait for breakout on XAU only", openedAt: "2026-03-02T10:00:00+07:00" }),
      belief({ id: "3", note: "Wait for breakout on XAU only", openedAt: "2026-03-03T10:00:00+07:00" }),
    ];
    const promos = buildBeliefPromotions(entries, "en");
    assert.ok(promos.some((p) => p.kind === "playbook_candidate"));
  });
});
