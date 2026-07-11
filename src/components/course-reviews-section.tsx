"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock, Star } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatRating } from "@/lib/utils";
import {
  REVIEW_RULES,
  type CourseReview,
  type ReviewEligibility,
} from "@/lib/reviews/types";

function formatRelativeDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface CourseReviewsSectionProps {
  courseSlug: string;
}

export function CourseReviewsSection({ courseSlug }: CourseReviewsSectionProps) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiBase = `/api/courses/${courseSlug}/reviews`;

  const loadReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (session?.userId) {
        params.set("userId", session.userId);
        if (session.email) params.set("email", session.email);
      }
      const qs = params.toString();
      const res = await fetch(`${apiBase}${qs ? `?${qs}` : ""}`, { cache: "no-store" });
      if (!res.ok) {
        setReviews([]);
        setEligibility(null);
        return;
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setEligibility(data.eligibility ?? null);
      setError(null);
    } catch {
      setReviews([]);
      setEligibility(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, session?.email, session?.userId]);

  useEffect(() => {
    setIsLoading(true);
    void loadReviews();
  }, [loadReviews]);

  async function submitReview() {
    if (!session) {
      setError("Masuk terlebih dahulu untuk mengirim ulasan.");
      return;
    }
    if (!acceptedRules) {
      setError("Centang persetujuan aturan sebelum mengirim.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.userId,
          email: session.email,
          rating,
          comment: comment.trim(),
          acceptedRules,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim ulasan.");
        return;
      }

      setReviews((prev) => [data.review, ...prev]);
      setComment("");
      setAcceptedRules(false);
      setRating(5);
      setSuccess("Ulasan terkirim. Terima kasih sudah berbagi pengalaman belajar.");
      setEligibility((prev) =>
        prev
          ? {
              ...prev,
              canReview: false,
              reason: "Kamu sudah mengirim ulasan untuk kelas ini.",
              existingReviewId: data.review?.id ?? prev.existingReviewId,
            }
          : prev
      );
    } catch {
      setError("Gagal mengirim ulasan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card space-y-4 p-5">
        <div>
          <h3 className="text-sm font-medium">Aturan rating & ulasan</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Ulasan hanya dari murid yang sudah menyelesaikan modul — untuk menekan review palsu /
            buzzer.
          </p>
        </div>
        <ul className="space-y-2">
          {REVIEW_RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        {!session ? (
          <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Lock className="size-4 shrink-0" />
              Masuk untuk mengecek kelayakan dan mengirim ulasan.
            </p>
            <Button size="sm" variant="outline" className="mt-3" render={<Link href="/masuk" />}>
              Masuk
            </Button>
          </div>
        ) : eligibility && !eligibility.canReview ? (
          <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <span>{eligibility.reason}</span>
            </p>
            {eligibility.existingReviewId == null && (
              <p className="mt-2 text-xs">
                Progres modul: {eligibility.completedModules}/{eligibility.totalModules} selesai.{" "}
                <Link href={`/belajar/${courseSlug}/l1`} className="link-muted underline">
                  Lanjutkan belajar
                </Link>
              </p>
            )}
          </div>
        ) : session && eligibility?.canReview ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs text-emerald">
              Syarat terpenuhi — {eligibility.completedModules} modul selesai. Kamu boleh mengirim
              ulasan.
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded p-1 transition-colors hover:bg-muted/50"
                  aria-label={`Rating ${value}`}
                >
                  <Star
                    className={cn(
                      "size-5",
                      value <= rating
                        ? "fill-foreground text-foreground"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">{rating}/5</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Ceritakan pengalaman belajarmu setelah menyelesaikan modul (min. 20 karakter)..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus:border-foreground/30 sm:text-sm"
            />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Saya sudah menyelesaikan modul dan menyetujui aturan di atas. Ulasan ini berdasarkan
                pengalaman belajar saya sendiri.
              </span>
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-emerald">{success}</p>}
            <Button
              size="sm"
              className="btn-primary"
              disabled={submitting || comment.trim().length < 20 || !acceptedRules}
              onClick={() => void submitReview()}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Kirim Ulasan
            </Button>
          </div>
        ) : session && !eligibility && !isLoading ? (
          <p className="text-xs text-muted-foreground">
            Tidak dapat memuat status kelayakan. Pastikan kelas sudah tersinkron di database.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat ulasan...
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada ulasan untuk kelas ini. Jadilah yang pertama setelah menyelesaikan modul.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="surface-card p-5">
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="bg-surface-2 text-xs">
                    {review.user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{review.user.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(review.createdAt)}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs">
                  <Star className="size-3.5 fill-foreground text-foreground" />
                  {formatRating(review.rating)}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
