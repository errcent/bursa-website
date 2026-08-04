import type { ReactElement } from "react";

import {
  WAITLIST_CONFIRMATION_PREVIEW,
  WAITLIST_CONFIRMATION_SUBJECT,
  WaitlistConfirmationEmail,
  waitlistConfirmationPlainText,
  type WaitlistConfirmationProps,
} from "./waitlist-confirmation";
import {
  WAITLIST_FOUNDER_STORY_PREVIEW,
  WAITLIST_FOUNDER_STORY_SUBJECT,
  WaitlistFounderStoryEmail,
  waitlistFounderStoryPlainText,
  type WaitlistFounderStoryProps,
} from "./waitlist-founder-story";
import {
  WAITLIST_PRODUCT_PREVIEW_PREVIEW,
  WAITLIST_PRODUCT_PREVIEW_SUBJECT,
  WaitlistProductPreviewEmail,
  waitlistProductPreviewPlainText,
  type WaitlistProductPreviewProps,
} from "./waitlist-product-preview";
import {
  WAITLIST_RISK_CHECKLIST_PREVIEW,
  WAITLIST_RISK_CHECKLIST_SUBJECT,
  WaitlistRiskChecklistEmail,
  waitlistRiskChecklistPlainText,
  type WaitlistRiskChecklistProps,
} from "./waitlist-risk-checklist";

export type LifecycleEmailKey =
  | "waitlist_confirmation"
  | "waitlist_risk_checklist"
  | "waitlist_product_preview"
  | "waitlist_founder_story";

export interface LifecycleEmailPropsByKey {
  waitlist_confirmation: WaitlistConfirmationProps;
  waitlist_risk_checklist: WaitlistRiskChecklistProps;
  waitlist_product_preview: WaitlistProductPreviewProps;
  waitlist_founder_story: WaitlistFounderStoryProps;
}

export interface LifecycleEmailDefinition<Props> {
  subject: string;
  preview: string;
  createNode: (props: Props) => ReactElement;
  plainText: (props: Props) => string;
}

export type LifecycleEmailRegistry = {
  [Key in LifecycleEmailKey]: LifecycleEmailDefinition<
    LifecycleEmailPropsByKey[Key]
  >;
};

export const lifecycleEmailRegistry = {
  waitlist_confirmation: {
    subject: WAITLIST_CONFIRMATION_SUBJECT,
    preview: WAITLIST_CONFIRMATION_PREVIEW,
    createNode: (props) => <WaitlistConfirmationEmail {...props} />,
    plainText: waitlistConfirmationPlainText,
  },
  waitlist_risk_checklist: {
    subject: WAITLIST_RISK_CHECKLIST_SUBJECT,
    preview: WAITLIST_RISK_CHECKLIST_PREVIEW,
    createNode: (props) => <WaitlistRiskChecklistEmail {...props} />,
    plainText: waitlistRiskChecklistPlainText,
  },
  waitlist_product_preview: {
    subject: WAITLIST_PRODUCT_PREVIEW_SUBJECT,
    preview: WAITLIST_PRODUCT_PREVIEW_PREVIEW,
    createNode: (props) => <WaitlistProductPreviewEmail {...props} />,
    plainText: waitlistProductPreviewPlainText,
  },
  waitlist_founder_story: {
    subject: WAITLIST_FOUNDER_STORY_SUBJECT,
    preview: WAITLIST_FOUNDER_STORY_PREVIEW,
    createNode: (props) => <WaitlistFounderStoryEmail {...props} />,
    plainText: waitlistFounderStoryPlainText,
  },
} satisfies LifecycleEmailRegistry;

export * from "./branded-email-layout";
export * from "./waitlist-confirmation";
export * from "./waitlist-founder-story";
export * from "./waitlist-launch";
export * from "./waitlist-product-preview";
export * from "./waitlist-risk-checklist";
