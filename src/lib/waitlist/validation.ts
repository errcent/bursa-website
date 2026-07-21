import { z } from "zod";

export const waitlistSubmitSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid."),
  consentGiven: z
    .boolean()
    .refine((value) => value === true, {
      message: "Setujui kebijakan privasi untuk melanjutkan.",
    }),
  source: z.string().trim().max(64).optional(),
  utmSource: z.string().trim().max(128).optional(),
  utmMedium: z.string().trim().max(128).optional(),
  utmCampaign: z.string().trim().max(128).optional(),
  utmContent: z.string().trim().max(128).optional(),
  turnstileToken: z.string().trim().optional(),
  /** Honeypot — must stay empty for real users. */
  website: z.string().max(0).optional(),
});

export type WaitlistSubmitInput = z.infer<typeof waitlistSubmitSchema>;
