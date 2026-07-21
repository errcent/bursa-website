import { z } from "zod";

export const createChatRoomSchema = z.object({
  mentorId: z.string().min(1).optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  roomKind: z
    .enum(["PUBLIC", "MENTOR_COMMUNITY", "MENTOR_INTERNAL"])
    .default("MENTOR_COMMUNITY"),
  tier: z.enum(["PEMULA", "MENENGAH", "MAHIR", "INTERNAL"]).default("PEMULA"),
  isProtected: z.boolean().default(false),
  screenshotProtection: z.boolean().default(false),
  memberOnly: z.boolean().default(true),
});

export const updateChatRoomSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  slowModeSeconds: z.number().int().min(0).max(300).optional(),
  isLive: z.boolean().optional(),
  liveTitle: z.string().max(160).nullable().optional(),
});

export const updateChatMemberRoleSchema = z.object({
  role: z.enum(["MEMBER", "MODERATOR", "MENTOR"]),
  requestedByUserId: z.string().min(1),
});

export const setRoomLiveSchema = z.object({
  isLive: z.boolean(),
  liveTitle: z.string().max(160).optional(),
  userId: z.string().min(1),
});

export const createChatMessageSchema = z.object({
  /** Optional when x-user-email / x-user-id resolves the sender. */
  userId: z.string().min(1).optional(),
  content: z.string().min(1).max(4000),
  messageType: z
    .enum(["TEXT", "SIGNAL", "POLL", "CHART", "ANNOUNCEMENT", "SYSTEM"])
    .default("TEXT"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** User ids @mentioned in the message — stored in metadata.mentions. */
  mentions: z.array(z.string().min(1)).max(50).optional(),
  replyToId: z.string().optional(),
});

export const reactToMessageSchema = z.object({
  userId: z.string().min(1),
  emoji: z.string().min(1).max(8),
});

export const createTradingSignalSchema = z.object({
  roomId: z.string().min(1),
  mentorId: z.string().min(1),
  /** Mentor hub branch; required for MENTOR_COMMUNITY rooms so the bubble lands in the active feed. */
  branchId: z.string().min(1).optional().nullable(),
  ticker: z.string().min(1).max(20),
  instrument: z.enum(["SAHAM", "CRYPTO", "FOREX"]),
  direction: z.enum(["LONG", "SHORT", "NEUTRAL"]),
  entryPrice: z.number().positive(),
  targetPrice: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  rationale: z.string().max(1000).optional(),
  /** Forced-resolution horizon so losing signals cannot stay "open" forever (QC-20260719-19). */
  expiryHours: z.number().positive().max(8760).optional(),
});

export const createTradingPollSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  /** Mentor hub branch; required for MENTOR_COMMUNITY rooms so the poll lands in the active feed. */
  branchId: z.string().min(1).optional().nullable(),
  question: z.string().min(1).max(280),
  options: z
    .array(z.string().min(1).max(100))
    .min(2)
    .max(6),
  /** Hours until expiry; omit or null for no expiry */
  durationHours: z.number().positive().max(168).optional().nullable(),
});

export const voteTradingPollSchema = z.object({
  userId: z.string().min(1),
  optionId: z.string().min(1),
});

export const createCourseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  mentorId: z.string().min(1),
  instrument: z.enum(["SAHAM", "CRYPTO", "FOREX"]),
  level: z.enum(["PEMULA", "MENENGAH", "MAHIR"]),
  price: z.number().int().nonnegative(),
  durationHours: z.number().int().positive(),
  shortDescription: z.string().min(1),
  outcomes: z.array(z.string()).default([]),
});

export const createMentorSchema = z.object({
  userId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  initials: z.string().min(1).max(4),
  bio: z.string().min(1),
  philosophy: z.string().min(1),
  spesialisasi: z.string().min(1),
  instruments: z.array(z.string()).min(1),
  licenseLabel: z.string().optional(),
  yearsExperience: z.number().int().nonnegative(),
});

export const createAdminChatRoomSchema = createChatRoomSchema;

export const moderationReviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewedBy: z.string().min(1),
});

export const mentorApplicationSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap wajib diisi."),
  email: z.string().email("Format email tidak valid."),
  phone: z.string().min(8, "Nomor telepon wajib diisi."),
  professionalTitle: z.string().min(3, "Judul profesional wajib diisi."),
  instruments: z
    .array(z.enum(["Saham", "Crypto", "Forex"]))
    .min(1, "Pilih minimal satu instrumen."),
  yearsExperience: z.number().int().min(1).max(50),
  licenseLabel: z.string().optional(),
  bio: z.string().min(50, "Bio minimal 50 karakter."),
  philosophy: z.string().min(30, "Filosofi trading minimal 30 karakter."),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  hasExistingContent: z.boolean(),
  estimatedCoursePrice: z.number().int().nonnegative().optional(),
  agreedToTerms: z
    .boolean()
    .refine((val) => val === true, { message: "Kamu harus menyetujui syarat & ketentuan." }),
  cvDocumentUrl: z.string().min(1, "CV wajib diunggah."),
  cvDocumentName: z.string().min(1, "Nama file CV wajib diisi."),
  certificateDocumentUrl: z.string().optional(),
  certificateDocumentName: z.string().optional(),
});

export const createLessonQuestionSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(2000),
  timestampSeconds: z
    .number()
    .nonnegative()
    .optional()
    .transform((v) => (v === undefined ? undefined : Math.floor(v))),
});

export const createLessonQuestionReplySchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(2000),
});

export const updateLessonQuestionSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(2000).optional(),
  isPinned: z.boolean().optional(),
});

export const lessonQuestionLikeSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
});

export const updateLessonQuestionReplySchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(2000),
});

export const createLessonNoteSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(50000),
  timestampSeconds: z
    .number()
    .nonnegative()
    .optional()
    .transform((v) => (v === undefined ? 0 : Math.floor(v))),
});

export const updateLessonNoteSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  content: z.string().min(1).max(50000).optional(),
  timestampSeconds: z
    .number()
    .nonnegative()
    .optional()
    .transform((v) => (v === undefined ? undefined : Math.floor(v))),
});

export const upsertLessonProgressSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  lessonId: z.string().min(1),
  completed: z.boolean(),
  watchedSeconds: z
    .number()
    .int()
    .min(0)
    .optional()
    .transform((v) => (v === undefined ? undefined : Math.floor(v))),
});

export const createCourseReviewSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(20, "Ulasan minimal 20 karakter.").max(2000),
  acceptedRules: z
    .boolean()
    .refine((val) => val === true, { message: "Kamu harus menyetujui aturan rating & ulasan." }),
});

export const updateUserProfileSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(2, "Nama pengguna minimal 2 karakter.").max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(/^[a-z0-9_]+$/, "Username hanya huruf kecil, angka, dan underscore.")
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null || v === "") return null;
      let digits = v.replace(/[\s\-().]/g, "");
      if (digits.startsWith("+")) digits = digits.slice(1);
      if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
      if (!digits.startsWith("62")) digits = `62${digits}`;
      return `+${digits}`;
    })
    .refine((v) => v === null || /^\+62[0-9]{9,13}$/.test(v), {
      message: "Format nomor telepon tidak valid (gunakan +62 atau 08...).",
    }),
  bio: z.string().max(500, "Bio maksimal 500 karakter.").optional(),
  avatarUrl: z
    .string()
    .max(3_000_000)
    .optional()
    .nullable()
    .refine(
      (v) =>
        v == null ||
        v === "" ||
        v.startsWith("/uploads/avatars/") ||
        v.startsWith("data:image/") ||
        v.startsWith("https://") ||
        v.startsWith("http://"),
      { message: "URL foto profil tidak valid." }
    ),
  role: z.string().optional(),
});

const watchlistInstrumentSchema = z
  .enum(["SAHAM", "CRYPTO", "FOREX", "Saham", "Crypto", "Forex"])
  .transform((v): "SAHAM" | "CRYPTO" | "FOREX" => {
    const map: Record<string, "SAHAM" | "CRYPTO" | "FOREX"> = {
      SAHAM: "SAHAM",
      CRYPTO: "CRYPTO",
      FOREX: "FOREX",
      Saham: "SAHAM",
      Crypto: "CRYPTO",
      Forex: "FOREX",
    };
    return map[v] ?? "SAHAM";
  });

export const createWatchlistItemSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  ticker: z
    .string()
    .trim()
    .min(1, "Ticker wajib diisi.")
    .max(20, "Ticker maksimal 20 karakter.")
    .regex(/^[A-Za-z0-9.\-/=]+$/, "Ticker hanya boleh huruf, angka, dan . - / =")
    .transform((v) => v.toUpperCase()),
  /** Optional — defaults to SAHAM so clients can add by ticker only */
  instrument: watchlistInstrumentSchema.optional().default("SAHAM"),
  notes: z
    .string()
    .max(280, "Catatan maksimal 280 karakter.")
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

export const deleteWatchlistItemSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
});

const playlistItemInputSchema = z
  .object({
    lessonId: z.string().min(1).optional(),
    courseId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.lessonId || value.courseId), {
    message: "Setiap item playlist harus memiliki lessonId atau courseId.",
  });

export const createPlaylistSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi.")
    .max(120, "Judul maksimal 120 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung.")
    .optional(),
  items: z.array(playlistItemInputSchema).max(100).optional(),
});

export const updatePlaylistSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi.")
    .max(120, "Judul maksimal 120 karakter.")
    .optional(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .nullable()
    .optional()
    .transform((v) => {
      if (v === null) return null;
      const trimmed = v?.trim();
      return trimmed ? trimmed : null;
    }),
});

export const deletePlaylistSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional(),
  role: z.string().optional(),
});

export const adminCreatePlaylistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi.")
    .max(120, "Judul maksimal 120 karakter."),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung.")
    .optional(),
  isPublished: z.boolean().optional(),
  items: z.array(playlistItemInputSchema).max(100).optional(),
});

export const adminUpdatePlaylistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul wajib diisi.")
    .max(120, "Judul maksimal 120 karakter.")
    .optional(),
  description: z
    .string()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .nullable()
    .optional()
    .transform((v) => {
      if (v === null) return null;
      const trimmed = v?.trim();
      return trimmed ? trimmed : null;
    }),
  isPublished: z.boolean().optional(),
});

export const adminPlaylistItemsSchema = z
  .object({
    lessonId: z.string().min(1).optional(),
    courseId: z.string().min(1).optional(),
    moduleId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.lessonId || value.courseId || value.moduleId), {
    message: "Pilih modul, pelajaran, atau kelas.",
  });

export const learningGuidanceAnswersSchema = z.object({
  instrument: z.enum(["Saham", "Crypto", "Forex"]),
  experience: z.enum(["never", "demo", "regular", "profitable"]),
  tradingStyle: z.enum(["scalping", "swing", "long_term"]),
  goal: z.enum(["side_income", "wealth", "basics", "retirement"]),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  timeAvailability: z.enum(["minimal", "part_time", "dedicated"]),
  capitalRange: z
    .enum(["under_5m", "5_20m", "20_50m", "above_50m", "prefer_not_say"])
    .optional(),
  learningFormat: z.enum(["video", "live", "community", "mixed"]),
});
