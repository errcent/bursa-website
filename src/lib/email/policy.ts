export const EMAIL_CATEGORIES = [
  "waitlist_confirmation",
  "auth_verification",
  "auth_password_reset",
  "auth_welcome",
  "mentor_admin",
  "mentor_applicant",
  "lifecycle",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

const DEFAULT_LAUNCH_ALLOWLIST: EmailCategory[] = [
  "waitlist_confirmation",
  "auth_verification",
  "auth_password_reset",
  "mentor_applicant",
];

export function parseEmailAllowedCategories(): Set<EmailCategory> | null {
  const raw = process.env.EMAIL_ALLOWED_CATEGORIES?.trim();
  if (!raw) return null;

  const allowed = new Set<EmailCategory>();
  for (const part of raw.split(",")) {
    const key = part.trim() as EmailCategory;
    if (EMAIL_CATEGORIES.includes(key)) {
      allowed.add(key);
    }
  }
  return allowed.size > 0 ? allowed : null;
}

export function isEmailCategoryAllowed(category: EmailCategory): boolean {
  const allowlist = parseEmailAllowedCategories();
  if (!allowlist) {
    return DEFAULT_LAUNCH_ALLOWLIST.includes(category);
  }
  return allowlist.has(category);
}
