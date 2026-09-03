import { z } from "zod";

import { toSafeHttpUrl } from "@/lib/security/safe-http-url";
import {
  L1_EXPERTISE_OPTIONS,
  L1_YEARS_OPTIONS,
  L2_CLAIMS_EVIDENCE_OPTIONS,
  L2_TARGET_STUDENT_OPTIONS,
  L2_TAUGHT_WHO_OPTIONS,
} from "@/lib/mentor-program/fields";

const expertiseValues = L1_EXPERTISE_OPTIONS.map((o) => o.value) as [
  (typeof L1_EXPERTISE_OPTIONS)[number]["value"],
  ...(typeof L1_EXPERTISE_OPTIONS)[number]["value"][],
];
const yearsValues = L1_YEARS_OPTIONS.map((o) => o.value) as [
  (typeof L1_YEARS_OPTIONS)[number]["value"],
  ...(typeof L1_YEARS_OPTIONS)[number]["value"][],
];
const taughtWhoValues = L2_TAUGHT_WHO_OPTIONS.map((o) => o.value) as [
  (typeof L2_TAUGHT_WHO_OPTIONS)[number]["value"],
  ...(typeof L2_TAUGHT_WHO_OPTIONS)[number]["value"][],
];
const targetStudentValues = L2_TARGET_STUDENT_OPTIONS.map((o) => o.value) as [
  (typeof L2_TARGET_STUDENT_OPTIONS)[number]["value"],
  ...(typeof L2_TARGET_STUDENT_OPTIONS)[number]["value"][],
];
const claimsValues = L2_CLAIMS_EVIDENCE_OPTIONS.map((o) => o.value) as [
  (typeof L2_CLAIMS_EVIDENCE_OPTIONS)[number]["value"],
  ...(typeof L2_CLAIMS_EVIDENCE_OPTIONS)[number]["value"][],
];

const httpUrl = z
  .string()
  .trim()
  .refine((value) => toSafeHttpUrl(value) !== null, {
    message: "URL harus http atau https.",
  });

const optionalHttpUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))
  .pipe(httpUrl.optional());

function uniqueUrls(...urls: Array<string | undefined>) {
  const normalized = urls
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\/+$/, "").toLowerCase());
  return new Set(normalized).size === normalized.length;
}

export const mentorL1ApplicationSchema = z
  .object({
    l1_full_name: z.string().trim().min(2, "Nama lengkap wajib diisi.").max(120),
    l1_email: z.string().trim().email("Format email tidak valid.").max(254),
    l1_country: z.string().trim().min(2, "Negara wajib diisi.").max(80),
    l1_city: z.string().trim().min(2, "Kota wajib diisi.").max(80),
    l1_linkedin_url: httpUrl,
    l1_website_url: optionalHttpUrl,
    l1_expertise: z.array(z.enum(expertiseValues)).min(1, "Pilih minimal satu keahlian."),
    l1_expertise_other: z.string().trim().max(80).optional(),
    l1_primary_expertise: z.string().trim().min(1, "Keahlian utama wajib dipilih."),
    l1_years_experience: z.enum(yearsValues),
    l1_professional_background: z
      .string()
      .trim()
      .min(40, "Latar belakang minimal 40 karakter.")
      .max(500, "Latar belakang maksimal 500 karakter."),
    l1_why_bursanalar: z
      .string()
      .trim()
      .min(400, "Minimal 400 karakter.")
      .max(800, "Maksimal 800 karakter."),
    l1_unique_knowledge: z
      .string()
      .trim()
      .min(400, "Minimal 400 karakter.")
      .max(800, "Maksimal 800 karakter."),
    l1_extra_links: z.array(httpUrl).max(3).default([]),
    l1_confirmation: z.literal(true, { error: "Konfirmasi wajib dicentang." }),
    turnstileToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.l1_expertise.includes("other") && !data.l1_expertise_other?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["l1_expertise_other"],
        message: "Jelaskan keahlian lainnya.",
      });
    }

    const allowedPrimary = data.l1_expertise.includes("other")
      ? [...data.l1_expertise, data.l1_expertise_other?.trim() ?? ""]
      : data.l1_expertise;
    if (!allowedPrimary.includes(data.l1_primary_expertise)) {
      ctx.addIssue({
        code: "custom",
        path: ["l1_primary_expertise"],
        message: "Keahlian utama harus salah satu yang sudah dipilih.",
      });
    }

    if (
      !uniqueUrls(data.l1_linkedin_url, data.l1_website_url, ...data.l1_extra_links)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["l1_extra_links"],
        message: "Tautan tidak boleh berulang.",
      });
    }
  });

export type MentorL1ApplicationInput = z.infer<typeof mentorL1ApplicationSchema>;

const previousRoleSchema = z.object({
  role: z.string().trim().min(1).max(120),
  organization: z.string().trim().min(1).max(160),
  start_year: z.number().int().min(1970).max(2100),
  end_year: z.number().int().min(1970).max(2100).optional().nullable(),
  description: z.string().trim().max(400).optional(),
});

const certificationSchema = z.object({
  label: z.string().trim().min(1).max(160),
  url: optionalHttpUrl,
});

export const mentorL2DraftSchema = z.object({
  l2_current_role: z.string().trim().max(160).optional(),
  l2_organization: z.string().trim().max(160).optional(),
  l2_years_experience: z.enum(yearsValues).optional(),
  l2_previous_roles: z.array(previousRoleSchema).max(12).optional(),
  l2_achievements: z.string().trim().max(4000).optional(),
  l2_markets: z.array(z.enum(expertiseValues)).optional(),
  l2_markets_other: z.string().trim().max(80).optional(),
  l2_teachable_subjects: z.string().trim().max(4000).optional(),
  l2_approach: z.string().trim().max(4000).optional(),
  l2_differentiator: z.string().trim().max(4000).optional(),
  l2_limitations: z.string().trim().max(4000).optional(),
  l2_cv_url: optionalHttpUrl,
  l2_certifications: z.array(certificationSchema).max(12).optional(),
  l2_publications: z.array(httpUrl).max(12).optional(),
  l2_other_evidence: z.string().trim().max(4000).optional(),
  l2_has_taught: z.boolean().optional(),
  l2_taught_who: z.array(z.enum(taughtWhoValues)).optional(),
  l2_teaching_experience: z.string().trim().max(4000).optional(),
  l2_good_student: z.string().trim().max(4000).optional(),
  l2_teaching_sample_url: optionalHttpUrl,
  l2_course_title: z.string().trim().max(160).optional(),
  l2_target_student: z.array(z.enum(targetStudentValues)).optional(),
  l2_course_problem: z.string().trim().max(4000).optional(),
  l2_learning_outcomes: z.string().trim().max(4000).optional(),
  l2_course_differentiator: z.string().trim().max(4000).optional(),
  l2_course_outline: z
    .array(z.object({ title: z.string().trim().min(1).max(160) }))
    .max(20)
    .optional(),
  l2_has_financial_relationships: z.boolean().optional(),
  l2_financial_relationships_explain: z.string().trim().max(4000).optional(),
  l2_sells_signals: z.boolean().optional(),
  l2_sells_signals_explain: z.string().trim().max(4000).optional(),
  l2_has_conflicts: z.boolean().optional(),
  l2_conflicts_explain: z.string().trim().max(4000).optional(),
  l2_claims_evidence: z.enum(claimsValues).optional(),
  l2_accuracy_confirmation: z.boolean().optional(),
  l2_review_confirmation: z.boolean().optional(),
});

export type MentorL2DraftInput = z.infer<typeof mentorL2DraftSchema>;

export const mentorL2SubmitSchema = mentorL2DraftSchema.superRefine((data, ctx) => {
  const requiredText: Array<[keyof MentorL2DraftInput, string]> = [
    ["l2_current_role", "Peran wajib diisi."],
    ["l2_achievements", "Capaian wajib diisi."],
    ["l2_teachable_subjects", "Subjek ajar wajib diisi."],
    ["l2_approach", "Pendekatan wajib diisi."],
    ["l2_differentiator", "Pembedaan wajib diisi."],
    ["l2_limitations", "Batasan wajib diisi."],
    ["l2_good_student", "Jawaban murid cocok wajib diisi."],
    ["l2_course_title", "Judul kursus wajib diisi."],
    ["l2_course_problem", "Masalah kursus wajib diisi."],
    ["l2_learning_outcomes", "Outcome wajib diisi."],
    ["l2_course_differentiator", "Pembedaan kursus wajib diisi."],
  ];
  for (const [key, message] of requiredText) {
    const value = data[key];
    if (typeof value !== "string" || value.trim().length < 8) {
      ctx.addIssue({ code: "custom", path: [key], message });
    }
  }
  if (!data.l2_years_experience) {
    ctx.addIssue({ code: "custom", path: ["l2_years_experience"], message: "Pengalaman wajib dipilih." });
  }
  if (!data.l2_markets?.length) {
    ctx.addIssue({ code: "custom", path: ["l2_markets"], message: "Pilih minimal satu domain." });
  } else if (data.l2_markets.includes("other") && !data.l2_markets_other?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_markets_other"],
      message: "Jelaskan domain lainnya.",
    });
  }
  if (!data.l2_teaching_sample_url) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_teaching_sample_url"],
      message: "Tautan sampel mengajar wajib.",
    });
  }
  if (!data.l2_target_student?.length) {
    ctx.addIssue({ code: "custom", path: ["l2_target_student"], message: "Pilih target murid." });
  }
  if (!data.l2_course_outline || data.l2_course_outline.length < 3) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_course_outline"],
      message: "Minimal 3 modul outline.",
    });
  }
  if (typeof data.l2_has_taught !== "boolean") {
    ctx.addIssue({ code: "custom", path: ["l2_has_taught"], message: "Pilih ya atau tidak." });
  } else if (data.l2_has_taught) {
    if (!data.l2_taught_who?.length) {
      ctx.addIssue({ code: "custom", path: ["l2_taught_who"], message: "Pilih siapa yang pernah diajar." });
    }
    if (!data.l2_teaching_experience?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["l2_teaching_experience"],
        message: "Deskripsikan pengalaman mengajar.",
      });
    }
  }
  if (typeof data.l2_has_financial_relationships !== "boolean") {
    ctx.addIssue({
      code: "custom",
      path: ["l2_has_financial_relationships"],
      message: "Pilih ya atau tidak.",
    });
  } else if (data.l2_has_financial_relationships && !data.l2_financial_relationships_explain?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_financial_relationships_explain"],
      message: "Jelaskan relasi finansial.",
    });
  }
  if (typeof data.l2_sells_signals !== "boolean") {
    ctx.addIssue({ code: "custom", path: ["l2_sells_signals"], message: "Pilih ya atau tidak." });
  } else if (data.l2_sells_signals && !data.l2_sells_signals_explain?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_sells_signals_explain"],
      message: "Jelaskan penjualan sinyal/langganan.",
    });
  }
  if (typeof data.l2_has_conflicts !== "boolean") {
    ctx.addIssue({ code: "custom", path: ["l2_has_conflicts"], message: "Pilih ya atau tidak." });
  } else if (data.l2_has_conflicts && !data.l2_conflicts_explain?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_conflicts_explain"],
      message: "Jelaskan konflik kepentingan.",
    });
  }
  if (!data.l2_claims_evidence) {
    ctx.addIssue({ code: "custom", path: ["l2_claims_evidence"], message: "Pilih opsi bukti klaim." });
  }
  if (data.l2_accuracy_confirmation !== true) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_accuracy_confirmation"],
      message: "Konfirmasi akurasi wajib.",
    });
  }
  if (data.l2_review_confirmation !== true) {
    ctx.addIssue({
      code: "custom",
      path: ["l2_review_confirmation"],
      message: "Konfirmasi peninjauan wajib.",
    });
  }
});

export const adminDirectInviteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  note: z.string().trim().max(2000).optional(),
});

export const adminApplicationDecisionSchema = z.object({
  action: z.enum([
    "invite_l2",
    "reject",
    "talent_pool",
    "info_required",
    "revision_required",
    "mark_review",
    "mark_assessment",
    "mark_final_review",
    "approve",
    "onboarding",
    "production_ready",
  ]),
  note: z.string().trim().max(4000).optional(),
});
