import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hashL2Token } from "@/lib/mentor-program/l2-token";
import { canTransition } from "@/lib/mentor-program/status-machine";
import { mentorL1ApplicationSchema, mentorL2SubmitSchema } from "@/lib/validations/mentor-application";

const l1Base = {
  l1_full_name: "Andi Mentor",
  l1_email: "andi@example.com",
  l1_country: "Indonesia",
  l1_city: "Jakarta",
  l1_linkedin_url: "https://linkedin.com/in/andi",
  l1_expertise: ["equities", "risk_management"],
  l1_primary_expertise: "equities",
  l1_years_experience: "5_10",
  l1_professional_background: "x".repeat(50),
  l1_why_bursanalar: "y".repeat(400),
  l1_unique_knowledge: "z".repeat(400),
  l1_extra_links: [],
  l1_confirmation: true as const,
};

describe("mentor L1 schema", () => {
  it("accepts a slim valid payload", () => {
    const parsed = mentorL1ApplicationSchema.safeParse(l1Base);
    assert.equal(parsed.success, true);
  });

  it("rejects primary expertise outside selected set", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...l1Base,
      l1_primary_expertise: "crypto",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects duplicate LinkedIn in extra links", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...l1Base,
      l1_extra_links: ["https://linkedin.com/in/andi"],
    });
    assert.equal(parsed.success, false);
  });

  it("rejects short differentiator essays", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...l1Base,
      l1_why_bursanalar: "terlalu pendek",
    });
    assert.equal(parsed.success, false);
  });
});

describe("mentor L2 submit", () => {
  it("accepts a complete L2 payload with sample URL", () => {
    const parsed = mentorL2SubmitSchema.safeParse({
      l2_current_role: "Portfolio manager",
      l2_achievements: "Mengelola buku ekuitas institusi selama delapan tahun.",
      l2_years_experience: "10_plus",
      l2_markets: ["equities"],
      l2_teachable_subjects: "Struktur pasar dan eksekusi institusi.",
      l2_approach: "Mulai dari microstructure lalu risiko.",
      l2_differentiator: "Fokus pada capacity dan slippage, bukan entry pattern.",
      l2_limitations: "Tidak cocok untuk scalping tick-by-tick.",
      l2_has_taught: false,
      l2_good_student: "Siap kerja rumah dan tidak mencari sinyal.",
      l2_teaching_sample_url: "https://www.loom.com/share/example",
      l2_course_title: "Market structure untuk trader menengah",
      l2_target_student: ["intermediate"],
      l2_course_problem: "Trader menengah tidak memahami mengapa fill buruk.",
      l2_learning_outcomes: "Mengidentifikasi, menganalisis, dan mengevaluasi fill.",
      l2_course_differentiator: "Bukan rekaman YouTube: framework eksekusi.",
      l2_course_outline: [{ title: "Konteks" }, { title: "Likuiditas" }, { title: "Risiko" }],
      l2_has_financial_relationships: false,
      l2_sells_signals: false,
      l2_has_conflicts: false,
      l2_claims_evidence: "not_applicable",
      l2_accuracy_confirmation: true,
      l2_review_confirmation: true,
    });
    assert.equal(parsed.success, true);
  });

  it("rejects L2 without teaching sample URL", () => {
    const parsed = mentorL2SubmitSchema.safeParse({
      l2_current_role: "Portfolio manager",
      l2_achievements: "Mengelola buku ekuitas institusi selama delapan tahun.",
      l2_years_experience: "10_plus",
      l2_markets: ["equities"],
      l2_teachable_subjects: "Struktur pasar dan eksekusi institusi.",
      l2_approach: "Mulai dari microstructure lalu risiko.",
      l2_differentiator: "Fokus pada capacity dan slippage, bukan entry pattern.",
      l2_limitations: "Tidak cocok untuk scalping tick-by-tick.",
      l2_has_taught: false,
      l2_good_student: "Siap kerja rumah dan tidak mencari sinyal.",
      l2_course_title: "Market structure untuk trader menengah",
      l2_target_student: ["intermediate"],
      l2_course_problem: "Trader menengah tidak memahami mengapa fill buruk.",
      l2_learning_outcomes: "Mengidentifikasi, menganalisis, dan mengevaluasi fill.",
      l2_course_differentiator: "Bukan rekaman YouTube: framework eksekusi.",
      l2_course_outline: [{ title: "Konteks" }, { title: "Likuiditas" }, { title: "Risiko" }],
      l2_has_financial_relationships: false,
      l2_sells_signals: false,
      l2_has_conflicts: false,
      l2_claims_evidence: "not_applicable",
      l2_accuracy_confirmation: true,
      l2_review_confirmation: true,
    });
    assert.equal(parsed.success, false);
  });
});

describe("status machine", () => {
  it("allows screening to L2 invite and forbids skip to approved", () => {
    assert.equal(canTransition("SCREENING", "L2_INVITED"), true);
    assert.equal(canTransition("SCREENING", "APPROVED"), false);
  });

  it("moves submitted L2 into review", () => {
    assert.equal(canTransition("L2_SUBMITTED", "REVIEW"), true);
  });

  it("allows L2 submit from invite or revision", () => {
    assert.equal(canTransition("L2_INVITED", "L2_SUBMITTED"), true);
    assert.equal(canTransition("REVISION_REQUIRED", "L2_SUBMITTED"), true);
    assert.equal(canTransition("SCREENING", "L2_SUBMITTED"), false);
  });
});

describe("L2 token hash", () => {
  it("is deterministic sha256 hex", () => {
    const token = "a".repeat(64);
    const hash = hashL2Token(token);
    assert.equal(hash, hashL2Token(token));
    assert.equal(hash.length, 64);
    assert.notEqual(hash, token);
  });
});
