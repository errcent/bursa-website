import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PRIVACY_HOST,
  hostRole,
  isPrivacyHostAllowedPath,
  isPrivacyPortalSurface,
  mapPrivacyPublicToInternal,
  privacyPublicPath,
} from "../src/lib/hosts/hosts";

describe("Privacy host routing", () => {
  it("maps privacy.bursanalar.com to the privacy role", () => {
    assert.equal(hostRole(PRIVACY_HOST), "privacy");
  });

  it("maps new public paths to internal slugs", () => {
    assert.equal(mapPrivacyPublicToInternal("/about"), "cara-kerja");
    assert.equal(mapPrivacyPublicToInternal("/requests/status"), "permintaan-status");
    assert.equal(mapPrivacyPublicToInternal("/policies"), "kebijakan");
  });

  it("allows about and request status paths on privacy host", () => {
    assert.equal(isPrivacyHostAllowedPath("/about"), true);
    assert.equal(isPrivacyHostAllowedPath("/requests/status"), true);
    assert.equal(isPrivacyHostAllowedPath("/en/about"), true);
    assert.equal(isPrivacyHostAllowedPath("/en/requests/status"), true);
    assert.equal(isPrivacyHostAllowedPath("/katalog"), false);
  });

  it("builds localized public paths for new slugs", () => {
    assert.equal(privacyPublicPath("cara-kerja", "id"), "/about");
    assert.equal(privacyPublicPath("permintaan-status", "en"), "/en/requests/status");
  });

  it("treats localhost /privasi as privacy surface via header", () => {
    assert.equal(isPrivacyPortalSurface("localhost:3000", "privacy"), true);
    assert.equal(isPrivacyPortalSurface("localhost:3000", null), false);
    assert.equal(isPrivacyPortalSurface(PRIVACY_HOST, null), true);
  });
});
