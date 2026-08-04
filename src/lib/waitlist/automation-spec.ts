interface TemplateIds {
  riskChecklist: string;
  productPreview: string;
  founderStory: string;
  launchAnnouncement?: string;
  launchDemo?: string;
  launchFaq?: string;
  launchOpen?: string;
  launchFollowup?: string;
}

const activeRule = {
  type: "and",
  rules: [
    {
      type: "rule",
      field: "contact.properties.converted",
      operator: "neq",
      value: "true",
    },
    {
      type: "rule",
      field: "contact.unsubscribed",
      operator: "eq",
      value: false,
    },
  ],
};

const variables = {
  SITE_URL: { var: "event.siteUrl" },
  PREFERENCES_URL: { var: "event.preferencesUrl" },
  UNSUBSCRIBE_URL: { var: "event.unsubscribeUrl" },
};

const launchVariables = {
  ...variables,
  LAUNCH_DATE: { var: "event.launchDate" },
  LAUNCH_URL: { var: "event.launchUrl" },
};

export function buildWaitlistOnboardingAutomation(templateIds: TemplateIds) {
  return {
    name: "Bursa Waitlist Onboarding v1",
    status: "disabled" as const,
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "waitlist.joined" },
      },
      { key: "delay_d2", type: "delay", config: { duration: "2 days" } },
      {
        key: "check_risk",
        type: "condition",
        config: {
          ...activeRule,
          rules: [
            ...activeRule.rules,
            {
              type: "rule",
              field: "contact.properties.wants_education",
              operator: "eq",
              value: "true",
            },
          ],
        },
      },
      {
        key: "risk_checklist",
        type: "send_email",
        config: { template: { id: templateIds.riskChecklist, variables } },
      },
      { key: "delay_d6", type: "delay", config: { duration: "4 days" } },
      {
        key: "check_preview",
        type: "condition",
        config: {
          ...activeRule,
          rules: [
            ...activeRule.rules,
            {
              type: "rule",
              field: "contact.properties.wants_product_updates",
              operator: "eq",
              value: "true",
            },
          ],
        },
      },
      {
        key: "product_preview",
        type: "send_email",
        config: { template: { id: templateIds.productPreview, variables } },
      },
      { key: "delay_d12", type: "delay", config: { duration: "6 days" } },
      {
        key: "check_story",
        type: "condition",
        config: {
          ...activeRule,
          rules: [
            ...activeRule.rules,
            {
              type: "rule",
              field: "contact.properties.wants_product_updates",
              operator: "eq",
              value: "true",
            },
          ],
        },
      },
      {
        key: "founder_story",
        type: "send_email",
        config: { template: { id: templateIds.founderStory, variables } },
      },
    ],
    connections: [
      { from: "start", to: "delay_d2" },
      { from: "delay_d2", to: "check_risk" },
      { from: "check_risk", to: "risk_checklist", type: "condition_met" },
      { from: "check_risk", to: "delay_d6", type: "condition_not_met" },
      { from: "risk_checklist", to: "delay_d6" },
      { from: "delay_d6", to: "check_preview" },
      { from: "check_preview", to: "product_preview", type: "condition_met" },
      { from: "check_preview", to: "delay_d12", type: "condition_not_met" },
      { from: "product_preview", to: "delay_d12" },
      { from: "delay_d12", to: "check_story" },
      { from: "check_story", to: "founder_story", type: "condition_met" },
    ],
  };
}

export function buildDormantLaunchAutomation(templateIds: TemplateIds) {
  const required = [
    templateIds.launchAnnouncement,
    templateIds.launchDemo,
    templateIds.launchFaq,
    templateIds.launchOpen,
    templateIds.launchFollowup,
  ];
  if (required.some((id) => !id)) {
    throw new Error("Semua template launch wajib tersedia sebelum automation dibuat.");
  }

  return {
    name: "Bursa Launch Sequence v1 (DORMANT)",
    status: "disabled" as const,
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "waitlist.launch.start" },
      },
      {
        key: "announce_t14",
        type: "send_email",
        config: { template: { id: templateIds.launchAnnouncement!, variables: launchVariables } },
      },
      { key: "delay_t7", type: "delay", config: { duration: "7 days" } },
      {
        key: "demo_t7",
        type: "send_email",
        config: { template: { id: templateIds.launchDemo!, variables: launchVariables } },
      },
      { key: "delay_t2", type: "delay", config: { duration: "5 days" } },
      {
        key: "faq_t2",
        type: "send_email",
        config: { template: { id: templateIds.launchFaq!, variables: launchVariables } },
      },
      { key: "delay_t0", type: "delay", config: { duration: "2 days" } },
      {
        key: "launch_t0",
        type: "send_email",
        config: { template: { id: templateIds.launchOpen!, variables: launchVariables } },
      },
      { key: "delay_t1", type: "delay", config: { duration: "1 day" } },
      {
        key: "check_engaged_non_converter",
        type: "condition",
        config: {
          type: "and",
          rules: [
            ...activeRule.rules,
            {
              type: "rule",
              field: "contact.properties.engaged",
              operator: "eq",
              value: "true",
            },
          ],
        },
      },
      {
        key: "followup_t1",
        type: "send_email",
        config: { template: { id: templateIds.launchFollowup!, variables: launchVariables } },
      },
    ],
    connections: [
      { from: "start", to: "announce_t14" },
      { from: "announce_t14", to: "delay_t7" },
      { from: "delay_t7", to: "demo_t7" },
      { from: "demo_t7", to: "delay_t2" },
      { from: "delay_t2", to: "faq_t2" },
      { from: "faq_t2", to: "delay_t0" },
      { from: "delay_t0", to: "launch_t0" },
      { from: "launch_t0", to: "delay_t1" },
      { from: "delay_t1", to: "check_engaged_non_converter" },
      {
        from: "check_engaged_non_converter",
        to: "followup_t1",
        type: "condition_met",
      },
    ],
  };
}

