export interface CourseReviewAuthor {
  id: string;
  nama: string;
  initials: string;
}

export interface CourseReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: CourseReviewAuthor;
}

export interface ModuleCompletionSummary {
  moduleId: string;
  title: string;
  lessonCount: number;
  completedLessonCount: number;
  isComplete: boolean;
}

export interface ReviewEligibility {
  canReview: boolean;
  reason: string | null;
  completedModules: number;
  totalModules: number;
  modules: ModuleCompletionSummary[];
  existingReviewId: string | null;
}

export const REVIEW_RULES = [
  "Selesaikan minimal satu modul penuh (semua lesson di modul tersebut) sebelum mengirim ulasan.",
  "Satu akun hanya boleh mengirim satu ulasan per kelas.",
  "Ulasan harus berdasarkan pengalaman belajarmu sendiri — bukan review palsu atau buzzer.",
  "Hindari spam, bahasa kasar, dan janji profit yang menyesatkan.",
] as const;
