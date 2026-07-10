import { z } from "zod";

export type LoginIdentifierKind = "email" | "username" | "phone";

/** Normalize Indonesian phone numbers to E.164 (+62...). */
export function normalizeIndonesianPhone(raw: string): string {
  let digits = raw.trim().replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }
  if (!digits.startsWith("62")) {
    digits = `62${digits}`;
  }
  return `+${digits}`;
}

const INDONESIAN_PHONE_REGEX = /^\+62[0-9]{9,13}$/;

export function isValidIndonesianPhone(value: string): boolean {
  return INDONESIAN_PHONE_REGEX.test(value);
}

export function classifyLoginIdentifier(raw: string): LoginIdentifierKind {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return "email";
  const phoneCandidate = normalizeIndonesianPhone(trimmed);
  if (isValidIndonesianPhone(phoneCandidate) && /^[\d+\s\-().]+$/.test(trimmed)) {
    return "phone";
  }
  return "username";
}

export function normalizeLoginIdentifier(raw: string): string {
  const trimmed = raw.trim();
  const kind = classifyLoginIdentifier(trimmed);
  if (kind === "email") return trimmed.toLowerCase();
  if (kind === "phone") return normalizeIndonesianPhone(trimmed);
  return trimmed.toLowerCase();
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username minimal 3 karakter.")
  .max(30, "Username maksimal 30 karakter.")
  .regex(/^[a-z0-9_]+$/, "Username hanya huruf kecil, angka, dan underscore.");

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Nomor telepon wajib diisi.")
  .transform(normalizeIndonesianPhone)
  .refine(isValidIndonesianPhone, "Format nomor telepon tidak valid (gunakan +62 atau 08...).");

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    return normalizeIndonesianPhone(v);
  })
  .refine((v) => v === undefined || isValidIndonesianPhone(v), {
    message: "Format nomor telepon tidak valid (gunakan +62 atau 08...).",
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username, email, atau telepon wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(120),
  email: z.string().trim().toLowerCase().email("Format email tidak valid."),
  username: usernameSchema,
  phone: optionalPhoneSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
});

export const ensureUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  username: usernameSchema.optional(),
  phone: optionalPhoneSchema,
  role: z.string().optional(),
  userId: z.string().optional(),
});
