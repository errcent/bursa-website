"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { enrollUser, isEnrolled } from "@/lib/video/protection";

/**
 * Resolves whether the signed-in user already subscribed to a course
 * (localStorage demo enroll + Prisma Enrollment via GET /enroll).
 */
export function useCourseEnrollment(courseSlug: string) {
  const { session, isLoading: authLoading } = useAuth();
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!session?.userId || !courseSlug) {
      setEnrolled(false);
      setLoading(false);
      return;
    }

    const localEnrolled = isEnrolled(session.userId, courseSlug);
    setEnrolled(localEnrolled);
    setLoading(true);

    let cancelled = false;

    async function check() {
      try {
        const params = new URLSearchParams({
          userId: session!.userId,
          email: session!.email,
        });
        const res = await fetch(
          `/api/courses/${encodeURIComponent(courseSlug)}/enroll?${params}`,
          {
            cache: "no-store",
            headers: { "x-user-email": session!.email },
          }
        );
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { enrolled?: boolean };
          const serverEnrolled = Boolean(data.enrolled);
          let next = serverEnrolled || localEnrolled;
          setEnrolled(next);
          if (next) {
            enrollUser(session!.userId, courseSlug);
          }
          // Heal: local enroll without DB row → create Enrollment + hub member.
          if (localEnrolled && !serverEnrolled && session!.email) {
            const syncRes = await fetch(
              `/api/courses/${encodeURIComponent(courseSlug)}/enroll`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-email": session!.email,
                },
                body: JSON.stringify({
                  email: session!.email,
                  userId: session!.userId,
                  name: session!.name,
                  role: session!.role,
                }),
              }
            );
            if (!cancelled && syncRes.ok) {
              next = true;
              setEnrolled(true);
            }
          }
        }
      } catch {
        if (!cancelled) setEnrolled(localEnrolled);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [authLoading, courseSlug, session]);

  return { enrolled, loading: authLoading || loading, session };
}
