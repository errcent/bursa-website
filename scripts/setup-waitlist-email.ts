import { render } from "@react-email/render";
import { Resend } from "resend";

import {
  lifecycleEmailRegistry,
  waitlistLaunchEmailDefinitions,
  type LaunchEmailKey,
  type LifecycleEmailKey,
  type WaitlistLaunchEmailProps,
  type WaitlistFounderStoryProps,
  type WaitlistProductPreviewProps,
  type WaitlistRiskChecklistProps,
} from "../src/emails";
import {
  buildDormantLaunchAutomation,
  buildWaitlistOnboardingAutomation,
} from "../src/lib/waitlist/automation-spec";

const apiKey = process.env.RESEND_SETUP_API_KEY?.trim();
const from = process.env.WAITLIST_EMAIL_FROM?.trim();
const replyTo = process.env.WAITLIST_REPLY_TO?.trim();
const rateLimitDelayMs = Number(process.env.RESEND_SETUP_DELAY_MS ?? 150);

if (!apiKey) throw new Error("RESEND_SETUP_API_KEY full-access sementara wajib di shell lokal.");
if (!from || from === "[SENSITIVE]") {
  throw new Error(
    "WAITLIST_EMAIL_FROM wajib diisi dengan sender terverifikasi, mis. `Bursa <belajar@bursanalar.com>`. Jangan load dari `vercel env pull` - nilai sensitif jadi `[SENSITIVE]`."
  );
}
if (!replyTo) throw new Error("WAITLIST_REPLY_TO wajib diisi dengan mailbox yang dipantau.");

const resend = new Resend(apiKey);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resendCall<T>(
  label: string,
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await sleep(rateLimitDelayMs);
    const result = await fn();
    if (!result.error) {
      if (!result.data) throw new Error(`Resend tidak mengembalikan data untuk ${label}.`);
      return result.data;
    }
    const retryable = /too many requests|rate limit/i.test(result.error.message);
    if (!retryable || attempt === 5) throw new Error(`${label}: ${result.error.message}`);
    await sleep(1000 * (attempt + 1));
  }
  throw new Error(`Resend gagal untuk ${label}.`);
}

async function ensureContactProperties() {
  const definitions = [
    ["experience_level", "unknown"],
    ["learning_goal", "unknown"],
    ["market_interest", "unknown"],
    ["wants_product_updates", "true"],
    ["wants_education", "true"],
    ["wants_launch_news", "true"],
    ["lifecycle_stage", "confirmed"],
    ["converted", "false"],
    ["engaged", "false"],
  ] as const;
  const listed = await resendCall("contactProperties.list", () => resend.contactProperties.list());
  const existing = new Set(listed.data.map((property) => property.key));

  for (const [key, fallbackValue] of definitions) {
    if (existing.has(key)) continue;
    await resendCall(`contactProperties.create:${key}`, () =>
      resend.contactProperties.create({
        key,
        type: "string",
        fallbackValue,
      })
    );
  }
}

async function ensureTopics() {
  const definitions = [
    {
      env: "RESEND_TOPIC_PRODUCT_ID",
      name: "Update Produk Bursa",
      description: "Perkembangan produk dan build update yang substansial.",
    },
    {
      env: "RESEND_TOPIC_EDUCATION_ID",
      name: "Edukasi Bursa",
      description: "Mini lesson, checklist, dan materi belajar Bursa.",
    },
    {
      env: "RESEND_TOPIC_LAUNCH_ID",
      name: "Kabar Peluncuran Bursa",
      description: "Tanggal, demo, FAQ, dan informasi akses peluncuran.",
    },
  ] as const;
  const listed = await resendCall("topics.list", () => resend.topics.list());
  const byName = new Map(listed.data.map((topic) => [topic.name, topic.id]));
  const ids: Record<string, string> = {};

  for (const definition of definitions) {
    const existingId = byName.get(definition.name);
    if (existingId) {
      ids[definition.env] = existingId;
      continue;
    }
    const created = await resendCall(`topics.create:${definition.name}`, () =>
      resend.topics.create({
        name: definition.name,
        description: definition.description,
        defaultSubscription: "opt_in",
        visibility: "public",
      })
    );
    ids[definition.env] = created.id;
  }
  return ids;
}

const templateProps = {
  email: "{{{contact.email}}}",
  siteUrl: "{{{SITE_URL}}}",
  preferencesUrl: "{{{PREFERENCES_URL}}}",
  unsubscribeUrl: "{{{UNSUBSCRIBE_URL}}}",
} satisfies
  | WaitlistRiskChecklistProps
  | WaitlistProductPreviewProps
  | WaitlistFounderStoryProps;

async function ensureTemplate(key: Exclude<LifecycleEmailKey, "waitlist_confirmation">) {
  const definition = lifecycleEmailRegistry[key];
  const name = `Bursa ${key} v1`;
  const html = await render(definition.createNode(templateProps));
  const text = definition.plainText(templateProps);
  const input = {
    name,
    from,
    replyTo,
    subject: definition.subject,
    html,
    text,
    variables: [
      { key: "SITE_URL", type: "string" as const, fallbackValue: "https://bursanalar.com" },
      {
        key: "PREFERENCES_URL",
        type: "string" as const,
        fallbackValue: "https://bursanalar.com/email-preferences",
      },
      {
        key: "UNSUBSCRIBE_URL",
        type: "string" as const,
        fallbackValue: "https://bursanalar.com/email-preferences",
      },
    ],
  };

  const listed = await resendCall(`templates.list:${name}`, () => resend.templates.list({ limit: 100 }));
  const existing = listed.data.find((template) => template.name === name);
  const id = existing
    ? (await resendCall(`templates.update:${name}`, () => resend.templates.update(existing.id, input))).id
    : (await resendCall(`templates.create:${name}`, () => resend.templates.create(input))).id;
  await resendCall(`templates.publish:${name}`, () => resend.templates.publish(id));
  return id;
}

async function ensureLaunchTemplate(key: LaunchEmailKey) {
  const definition = waitlistLaunchEmailDefinitions[key];
  const name = `Bursa ${key} v1`;
  const props = {
    ...templateProps,
    launchDate: "{{{LAUNCH_DATE}}}",
    launchUrl: "{{{LAUNCH_URL}}}",
  } satisfies WaitlistLaunchEmailProps;
  const html = await render(definition.createNode(props));
  const input = {
    name,
    from,
    replyTo,
    subject: definition.subject,
    html,
    text: definition.plainText(props),
    variables: [
      { key: "SITE_URL", type: "string" as const, fallbackValue: "https://bursanalar.com" },
      {
        key: "PREFERENCES_URL",
        type: "string" as const,
        fallbackValue: "https://bursanalar.com/email-preferences",
      },
      {
        key: "UNSUBSCRIBE_URL",
        type: "string" as const,
        fallbackValue: "https://bursanalar.com/email-preferences",
      },
      { key: "LAUNCH_DATE", type: "string" as const, fallbackValue: "belum ditetapkan" },
      { key: "LAUNCH_URL", type: "string" as const, fallbackValue: "https://bursanalar.com" },
    ],
  };
  const listed = await resendCall(`templates.list:${name}`, () => resend.templates.list({ limit: 100 }));
  const existing = listed.data.find((template) => template.name === name);
  const id = existing
    ? (await resendCall(`templates.update:${name}`, () => resend.templates.update(existing.id, input))).id
    : (await resendCall(`templates.create:${name}`, () => resend.templates.create(input))).id;
  await resendCall(`templates.publish:${name}`, () => resend.templates.publish(id));
  return id;
}

async function ensureOnboardingAutomation(templateIds: {
  riskChecklist: string;
  productPreview: string;
  founderStory: string;
}) {
  const spec = buildWaitlistOnboardingAutomation(templateIds);
  const listed = await resendCall("automations.list:onboarding", () => resend.automations.list());
  const existing = listed.data.find((automation) => automation.name === spec.name);
  if (existing) {
    await resendCall("automations.update:onboarding", () => resend.automations.update(existing.id, spec));
    return existing.id;
  }
  return (await resendCall("automations.create:onboarding", () => resend.automations.create(spec))).id;
}

async function ensureDormantLaunchAutomation(templateIds: {
  launchAnnouncement: string;
  launchDemo: string;
  launchFaq: string;
  launchOpen: string;
  launchFollowup: string;
}) {
  const spec = buildDormantLaunchAutomation({
    riskChecklist: "",
    productPreview: "",
    founderStory: "",
    ...templateIds,
  });
  const listed = await resendCall("automations.list:launch", () => resend.automations.list());
  const existing = listed.data.find((automation) => automation.name === spec.name);
  if (existing) {
    await resendCall("automations.update:launch", () => resend.automations.update(existing.id, spec));
    return existing.id;
  }
  return (await resendCall("automations.create:launch", () => resend.automations.create(spec))).id;
}

async function main() {
  await ensureContactProperties();
  const topicIds = await ensureTopics();
  const riskChecklist = await ensureTemplate("waitlist_risk_checklist");
  const productPreview = await ensureTemplate("waitlist_product_preview");
  const founderStory = await ensureTemplate("waitlist_founder_story");
  const automationId = await ensureOnboardingAutomation({
    riskChecklist,
    productPreview,
    founderStory,
  });
  const launchAnnouncement = await ensureLaunchTemplate("waitlist_launch_announcement");
  const launchDemo = await ensureLaunchTemplate("waitlist_launch_demo");
  const launchFaq = await ensureLaunchTemplate("waitlist_launch_faq");
  const launchOpen = await ensureLaunchTemplate("waitlist_launch_open");
  const launchFollowup = await ensureLaunchTemplate("waitlist_launch_followup");
  const launchAutomationId = await ensureDormantLaunchAutomation({
    launchAnnouncement,
    launchDemo,
    launchFaq,
    launchOpen,
    launchFollowup,
  });

  console.log(
    JSON.stringify(
      {
        topicIds,
        templates: { riskChecklist, productPreview, founderStory },
        automationId,
        launchAutomationId,
        automationStatus: "disabled",
        launchAutomationStatus: "disabled",
        next: "Set topic IDs in Vercel, seed internal cohort, then enable onboarding after validation. Keep launch disabled until a real launch date exists.",
      },
      null,
      2
    )
  );
}

void main();

