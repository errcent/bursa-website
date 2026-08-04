import assert from "node:assert/strict";
import test from "node:test";

import { buildWaitlistOnboardingAutomation } from "../src/lib/waitlist/automation-spec";
import {
  isWaitlistLifecycleEligible,
  isWithinWaitlistFrequencyCap,
} from "../src/lib/waitlist/config";
import {
  createPreferenceSignature,
  verifyPreferenceSignature,
} from "../src/lib/waitlist/preferences";
import { duplicateWaitlistTransition } from "../src/lib/waitlist/state";
import { waitlistPreferencesSchema, waitlistSubmitSchema } from "../src/lib/waitlist/validation";

process.env.WAITLIST_PREFERENCES_SECRET = "test-secret-with-enough-entropy";

test("single opt-in requires explicit consent", () => {
  assert.equal(
    waitlistSubmitSchema.safeParse({ email: "reader@example.com", consentGiven: false }).success,
    false
  );
  assert.equal(
    waitlistSubmitSchema.safeParse({ email: "reader@example.com", consentGiven: true }).success,
    true
  );
});

test("preference signatures reject tampering", () => {
  const signature = createPreferenceSignature("entry_123");
  assert.equal(verifyPreferenceSignature("entry_123", signature), true);
  assert.equal(verifyPreferenceSignature("entry_456", signature), false);
});

test("duplicate signup only reactivates an explicit unsubscribe", () => {
  assert.deepEqual(duplicateWaitlistTransition("UNSUBSCRIBED", true), {
    shouldConfirm: true,
    shouldSendConfirmation: true,
    shouldSyncLifecycle: true,
    nextStatus: "ACTIVE",
  });
  assert.equal(duplicateWaitlistTransition("SUPPRESSED", true).shouldSyncLifecycle, false);
  assert.equal(duplicateWaitlistTransition("CONVERTED", true).nextStatus, "CONVERTED");
});

test("frequency cap allows one per day and two per seven days", () => {
  assert.equal(isWithinWaitlistFrequencyCap(0, 0), true);
  assert.equal(isWithinWaitlistFrequencyCap(1, 1), false);
  assert.equal(isWithinWaitlistFrequencyCap(0, 2), false);
});

test("lifecycle rollout defaults closed and always includes internal cohort", () => {
  process.env.WAITLIST_LIFECYCLE_ROLLOUT_PERCENT = "0";
  process.env.WAITLIST_INTERNAL_COHORT = "internal@example.com";
  assert.equal(isWaitlistLifecycleEligible("entry_a", "public@example.com"), false);
  assert.equal(isWaitlistLifecycleEligible("entry_b", "internal@example.com"), true);
});

test("all preference topics may be disabled for unsubscribe", () => {
  const result = waitlistPreferencesSchema.safeParse({
    wantsProductUpdates: false,
    wantsEducation: false,
    wantsLaunchNews: false,
  });
  assert.equal(result.success, true);
});

test("onboarding automation stays dormant and follows D+2, D+6, D+12 cadence", () => {
  const automation = buildWaitlistOnboardingAutomation({
    riskChecklist: "tpl_risk",
    productPreview: "tpl_preview",
    founderStory: "tpl_story",
  });
  assert.equal(automation.status, "disabled");
  assert.deepEqual(
    automation.steps
      .filter((step) => step.type === "delay")
      .map((step) => (step.config as { duration: string }).duration),
    ["2 days", "4 days", "6 days"]
  );
});

