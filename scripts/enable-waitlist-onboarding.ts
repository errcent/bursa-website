import { Resend } from "resend";

import { buildWaitlistOnboardingAutomation } from "../src/lib/waitlist/automation-spec";

const apiKey = process.env.RESEND_SETUP_API_KEY?.trim() ?? process.env.RESEND_SETUP_KEY?.trim();
const automationId = process.env.WAITLIST_ONBOARDING_AUTOMATION_ID?.trim();

if (!apiKey) throw new Error("RESEND_SETUP_KEY wajib di shell.");
if (!automationId) throw new Error("WAITLIST_ONBOARDING_AUTOMATION_ID wajib di shell.");

const resend = new Resend(apiKey);

async function main() {
  const spec = buildWaitlistOnboardingAutomation({
    riskChecklist: "a10998ce-9a60-42c1-a252-0786865cf31b",
    productPreview: "705735f1-d9b5-4344-b060-ad1789718762",
    founderStory: "ad5516d8-629c-4e25-b662-43ef1077c450",
  });
  const { data, error } = await resend.automations.update(automationId, {
    ...spec,
    status: "enabled",
  });
  if (error) throw new Error(error.message);
  console.log(JSON.stringify({ automationId: data?.id ?? automationId, status: "enabled" }, null, 2));
}

void main();
