export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || "Bursa <onboarding@resend.dev>";
}

export function getMentorApplicationAdminEmail(): string {
  return (
    process.env.MENTOR_APPLICATION_ADMIN_EMAIL?.trim() ||
    "admin.kitty033@passinbox.com"
  );
}

export function isMentorApplicationEmailEnabled(): boolean {
  const flag = process.env.MENTOR_APPLICATION_EMAIL_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return isEmailConfigured();
}
