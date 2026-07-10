"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";

export type LearningCourseProgress = {
  slug: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string;
};

type LearningPayload = {
  courses: LearningCourseProgress[];
};

/**
 * Loads enrollments + lesson progress for the signed-in user via GET /api/me/learning.
 * Guests get an empty map (treat all courses as not purchased).
 */
export function useMyLearning() {
  const { session, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<LearningCourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!session?.userId && !session?.email) {
      setCourses([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.email ? { email: session.email } : {}),
    });

    void fetch(`/api/me/learning?${params}`, {
      cache: "no-store",
      headers: session.email ? { "x-user-email": session.email } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return (await res.json()) as LearningPayload;
      })
      .then((data) => {
        if (!cancelled) setCourses(data.courses ?? []);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, session?.userId, session?.email]);

  const bySlug = useMemo(() => {
    const map = new Map<string, LearningCourseProgress>();
    for (const course of courses) {
      map.set(course.slug, course);
    }
    return map;
  }, [courses]);

  return {
    courses,
    bySlug,
    loading: authLoading || loading,
    isAuthenticated: Boolean(session?.userId || session?.email),
  };
}
