export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number;
}

const RULES = [
  {
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
    message: `Minimal ${PASSWORD_MIN_LENGTH} karakter.`,
  },
  {
    test: (p: string) => /[a-z]/.test(p),
    message: "Sertakan huruf kecil.",
  },
  {
    test: (p: string) => /[A-Z]/.test(p),
    message: "Sertakan huruf besar.",
  },
  {
    test: (p: string) => /\d/.test(p),
    message: "Sertakan angka.",
  },
] as const;

export function validatePassword(password: string): PasswordValidation {
  const errors = RULES.filter((rule) => !rule.test(password)).map((rule) => rule.message);
  const passed = RULES.length - errors.length;
  const score = Math.round((passed / RULES.length) * 100);

  let strength: PasswordStrength = "weak";
  if (passed >= 4) strength = "strong";
  else if (passed >= 3) strength = "good";
  else if (passed >= 2) strength = "fair";

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "***@***";
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}
