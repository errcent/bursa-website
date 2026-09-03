import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decryptField, encryptField, isEncryptedField } from "@/lib/crypto/field-encryption";
import { buildTxtExport, noteHasVisibleContent } from "@/lib/lesson-notes/export";
import { toSafeHttpUrl } from "@/lib/security/safe-http-url";
import { mentorL1ApplicationSchema } from "@/lib/validations/mentor-application";
import { DEMO_VIDEO_URL, resolvePlayableVideoUrl } from "@/lib/video/demo";

const l1Base = {
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

describe("toSafeHttpUrl", () => {
  it("keeps http(s) URLs", () => {
    assert.equal(toSafeHttpUrl("https://linkedin.com/in/andi"), "https://linkedin.com/in/andi");
    assert.ok(toSafeHttpUrl("http://example.com")?.startsWith("http://example.com"));
  });

  it("rejects javascript and data URLs", () => {
    assert.equal(toSafeHttpUrl("javascript:alert(1)"), null);
    assert.equal(toSafeHttpUrl("data:text/html,<script>alert(1)</script>"), null);
    assert.equal(toSafeHttpUrl("vbscript:msgbox(1)"), null);
  });
});

describe("mentor L1 URL review", () => {
  it("rejects javascript extra links", () => {
    const parsed = mentorL1ApplicationSchema.safeParse({
      ...l1Base,
      l1_extra_links: ["javascript:alert(1)"],
    });
    assert.equal(parsed.success, false);
  });
});

describe("resolvePlayableVideoUrl", () => {
  it("blocks the MDN demo host by hostname, not substring", () => {
    assert.equal(
      resolvePlayableVideoUrl("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"),
      DEMO_VIDEO_URL,
    );
    assert.equal(
      resolvePlayableVideoUrl("https://cdn.example/interactive-examples.mdn.mozilla.net/clip.mp4"),
      "https://cdn.example/interactive-examples.mdn.mozilla.net/clip.mp4",
    );
  });

  it("keeps first-party relative paths", () => {
    assert.equal(resolvePlayableVideoUrl("/media/preview-placeholder.mp4"), "/media/preview-placeholder.mp4");
  });
});

describe("lesson note HTML stripping", () => {
  const meta = { courseTitle: "Kelas", lessonTitle: "Lesson" };

  it("decodes entities once and drops tags", () => {
    const text = buildTxtExport("<p>Hello &amp; world</p>", meta);
    assert.match(text, /Hello & world/);
    assert.equal(noteHasVisibleContent("<p></p>"), false);
  });

  it("does not keep nested script tags after stripping", () => {
    const text = buildTxtExport("<scr<script>ipt>alert(1)</script>", meta);
    assert.doesNotMatch(text, /<script/i);
  });
});

describe("AES-GCM field encryption", () => {
  it("round-trips with an explicit 16-byte auth tag", () => {
    const encrypted = encryptField("6281110000001");
    assert.equal(isEncryptedField(encrypted), true);
    assert.equal(decryptField(encrypted), "6281110000001");
  });
});
