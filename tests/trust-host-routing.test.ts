import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  TRUST_HOST,
  hostRole,
  isTrustHostAllowedPath,
  isTrustPortalSurface,
  mapTrustPublicToInternal,
  trustPublicPath,
} from "../src/lib/hosts/hosts";
import { FRAMEWORKS, tabForTrustSlug } from "../src/lib/trust/public-posture";

describe("Trust host routing", () => {
  it("maps trust.bursanalar.com to the trust role", () => {
    assert.equal(hostRole(TRUST_HOST), "trust");
  });

  it("maps public paths to internal slugs", () => {
    assert.equal(mapTrustPublicToInternal("/"), "hub");
    assert.equal(mapTrustPublicToInternal("/controls"), "kontrol");
    assert.equal(mapTrustPublicToInternal("/resources"), "sumber-daya");
    assert.equal(mapTrustPublicToInternal("/security"), "keamanan");
  });

  it("allows trust paths and rejects catalog", () => {
    assert.equal(isTrustHostAllowedPath("/controls"), true);
    assert.equal(isTrustHostAllowedPath("/en/resources"), true);
    assert.equal(isTrustHostAllowedPath("/katalog"), false);
  });

  it("builds localized public paths", () => {
    assert.equal(trustPublicPath("kontrol", "id"), "/controls");
    assert.equal(trustPublicPath("sumber-daya", "en"), "/en/resources");
  });

  it("treats localhost /kepercayaan as trust surface via header", () => {
    assert.equal(isTrustPortalSurface("localhost:3000", "trust"), true);
    assert.equal(isTrustPortalSurface("localhost:3000", null), false);
    assert.equal(isTrustPortalSurface(TRUST_HOST, null), true);
  });
});

describe("Trust public posture", () => {
  it("maps slugs to overview/controls/resources tabs", () => {
    assert.equal(tabForTrustSlug("hub"), "overview");
    assert.equal(tabForTrustSlug("kontrol"), "controls");
    assert.equal(tabForTrustSlug("sumber-daya"), "resources");
    assert.equal(tabForTrustSlug("faq"), null);
  });

  it("does not mark SOC 2 or ISO as certified", () => {
    const soc2 = FRAMEWORKS.find((item) => item.id === "soc2");
    const iso = FRAMEWORKS.find((item) => item.id === "iso");
    assert.equal(soc2?.status, "roadmap");
    assert.equal(iso?.status, "roadmap");
  });
});
