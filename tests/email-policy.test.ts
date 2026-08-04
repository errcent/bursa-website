import assert from "node:assert/strict";
import test from "node:test";

import { isEmailCategoryAllowed, parseEmailAllowedCategories } from "../src/lib/email/policy";

test("default launch allowlist permits waitlist, verification, and password reset only", () => {
  delete process.env.EMAIL_ALLOWED_CATEGORIES;
  assert.equal(isEmailCategoryAllowed("waitlist_confirmation"), true);
  assert.equal(isEmailCategoryAllowed("auth_verification"), true);
  assert.equal(isEmailCategoryAllowed("auth_password_reset"), true);
  assert.equal(isEmailCategoryAllowed("auth_welcome"), false);
  assert.equal(isEmailCategoryAllowed("mentor_admin"), false);
  assert.equal(isEmailCategoryAllowed("lifecycle"), false);
});

test("explicit allowlist env overrides defaults", () => {
  process.env.EMAIL_ALLOWED_CATEGORIES = "waitlist_confirmation,auth_welcome";
  assert.equal(parseEmailAllowedCategories()?.has("auth_welcome"), true);
  assert.equal(isEmailCategoryAllowed("auth_verification"), false);
  delete process.env.EMAIL_ALLOWED_CATEGORIES;
});
