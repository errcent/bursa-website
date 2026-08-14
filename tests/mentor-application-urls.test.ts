import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mentorApplicationSchema } from "@/lib/validations/api";

describe("BN-SEC-007 mentor application document URLs", () => {
  const base = {
    fullName: "Andi Mentor",
    email: "andi@example.com",
    phone: "08123456789",
    professionalTitle: "Equity trader",
    instruments: ["Saham"] as ["Saham"],
    yearsExperience: 5,
    bio: "x".repeat(50),
    philosophy: "y".repeat(30),
    hasExistingContent: false,
    agreedToTerms: true,
    cvDocumentName: "cv.pdf",
  };

  it("accepts upload-prefix CV URLs", () => {
    const parsed = mentorApplicationSchema.safeParse({
      ...base,
      cvDocumentUrl: "/uploads/mentor-applications/cv-1.pdf",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts data-URL CV (Vercel inline storage)", () => {
    const parsed = mentorApplicationSchema.safeParse({
      ...base,
      cvDocumentUrl: "data:application/pdf;base64,AAA",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects arbitrary https CV URLs", () => {
    const parsed = mentorApplicationSchema.safeParse({
      ...base,
      cvDocumentUrl: "https://evil.example/cv.pdf",
    });
    assert.equal(parsed.success, false);
  });
});
