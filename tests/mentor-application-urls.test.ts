import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mentorL1ApplicationSchema, mentorL2SubmitSchema } from "@/lib/validations/mentor-application";

describe("L1 evidence is links, not public uploads", () => {
  const base = {
    l1_full_name: "Andi Mentor",
    l1_email: "andi@example.com",
    l1_country: "Indonesia",
    l1_city: "Jakarta",
    l1_linkedin_url: "https://linkedin.com/in/andi",
    l1_expertise: ["equities"],
    l1_primary_expertise: "equities",
    l1_years_experience: "5_10",
    l1_professional_background: "x".repeat(50),
    l1_why_bursanalar: "y".repeat(400),
    l1_unique_knowledge: "z".repeat(400),
    l1_confirmation: true as const,
  };

  it("accepts https professional URLs", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...base,
      l1_website_url: "https://andi.example",
      l1_extra_links: ["https://ssrn.com/abstract=1"],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects non-http extra links", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...base,
      l1_extra_links: ["javascript:alert(1)"],
    });
    assert.equal(parsed.success, false);
  });
});

describe("L2 evidence URLs", () => {
  it("rejects javascript teaching sample", () => {
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
      l2_teaching_sample_url: "javascript:alert(1)",
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
