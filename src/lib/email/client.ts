import { Resend } from "resend";

import { isEmailConfigured } from "@/lib/email/config";

let resendClient: Resend | null = null;
let resendManagementClient: Resend | null = null;

function createResendClient(apiKey: string | undefined): Resend | null {
  const trimmed = apiKey?.trim();
  return trimmed ? new Resend(trimmed) : null;
}

export function getResendClient(): Resend | null {
  if (!isEmailConfigured()) return null;

  if (!resendClient) {
    resendClient = createResendClient(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

export function getResendManagementClient(): Resend | null {
  const managementKey =
    process.env.RESEND_MANAGEMENT_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  if (!managementKey) return null;

  if (!resendManagementClient) {
    resendManagementClient = createResendClient(managementKey);
  }

  return resendManagementClient;
}
