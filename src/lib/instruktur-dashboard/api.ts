import { getSession } from "@/lib/auth/client";
import type { AdminCourse } from "@/lib/admin/types";
import type { Instrument, Level } from "@/lib/types";

export type MentorSocialLinks = {
  instagram?: string;
  youtube?: string;
  twitter?: string;
};

export type MentorDashboardProfile = {
  id: string;
  slug: string;
  title: string;
  initials: string;
  avatarUrl: string | null;
  bio: string;
  tagline: string | null;
  socialLinks: MentorSocialLinks | null;
  verificationStatus: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  name: string;
  email: string;
};

export type MentorTransactionItem = {
  id: string;
  transactionId: string;
  createdAt: string;
  courseTitle: string;
  courseSlug: string;
  learnerInitials: string;
  grossAmount: number;
  commissionPct: number;
  commissionAmount: number;
  netMentorAmount: number;
  payoutStatus: string;
  payoutPeriod: string | null;
  transactionStatus: string;
};

export type MentorTransactionsResponse = {
  items: MentorTransactionItem[];
  total: number;
  page: number;
  limit: number;
};

export type MentorCoursePatchInput = {
  title?: string;
  shortDescription?: string;
  level?: Level;
  instrument?: Instrument;
  price?: number;
};

function authHeaders(): HeadersInit {
  const session = getSession();
  if (!session) return {};
  return {
    "Content-Type": "application/json",
    "x-user-email": session.email,
  };
}

async function mentorsMeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/mentors/me${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* keep text */
    }
    throw new Error(message || "Permintaan gagal");
  }
  return res.json() as Promise<T>;
}

export async function fetchMentorDashboardProfile() {
  return mentorsMeRequest<MentorDashboardProfile>("/profile");
}

export async function updateMentorDashboardProfile(body: {
  bio?: string;
  tagline?: string | null;
  socialLinks?: MentorSocialLinks | null;
}) {
  return mentorsMeRequest<MentorDashboardProfile>("/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchMentorTransactions(page = 1, limit = 20) {
  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return mentorsMeRequest<MentorTransactionsResponse>(`/transactions?${q}`);
}

export async function updateMentorCourse(courseId: string, body: MentorCoursePatchInput) {
  return mentorsMeRequest<AdminCourse & { netMentorAmount?: number }>(`/courses/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
