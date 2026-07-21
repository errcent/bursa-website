"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { GuidanceOptionCard } from "@/components/learning-guidance/guidance-option-card";
import { GuidanceResults } from "@/components/learning-guidance/guidance-results";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GUIDANCE_QUESTIONS } from "@/lib/learning/guidance/questions";
import type { LearningGuidanceAnswers, LearningGuidanceResult } from "@/lib/learning/guidance/types";

function isAnswered(
  answers: Partial<LearningGuidanceAnswers>,
  questionId: keyof LearningGuidanceAnswers,
  optional?: boolean
): boolean {
  const value = answers[questionId];
  if (optional && (value === undefined || value === "prefer_not_say")) return true;
  return value !== undefined;
}

export function LearningGuidanceQuiz() {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<LearningGuidanceAnswers>>({});
  const [result, setResult] = useState<LearningGuidanceResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = GUIDANCE_QUESTIONS[step];
  const totalSteps = GUIDANCE_QUESTIONS.length;
  const progressPercent = result ? 100 : Math.round(((step + 1) / totalSteps) * 100);

  const canProceed = useMemo(
    () => (question ? isAnswered(answers, question.id, question.optional) : false),
    [answers, question]
  );

  const loadSavedProfile = useCallback(async () => {
    if (!session?.userId && !session?.email) return;

    setLoadingProfile(true);
    const params = new URLSearchParams({
      ...(session.userId ? { userId: session.userId } : {}),
      ...(session.email ? { email: session.email } : {}),
    });

    try {
      const res = await fetch(`/api/me/learning-guidance?${params}`, {
        cache: "no-store",
        headers: session.email ? { "x-user-email": session.email } : {},
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        profile: unknown;
        result: LearningGuidanceResult | null;
      };
      if (data.result) {
        setResult(data.result);
        setSaved(true);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingProfile(false);
    }
  }, [session]);

  function setAnswer<T extends keyof LearningGuidanceAnswers>(
    key: T,
    value: LearningGuidanceAnswers[T]
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function submitQuiz(finalAnswers: LearningGuidanceAnswers) {
    setLoading(true);
    setError(null);

    try {
      let data: { result?: LearningGuidanceResult; profile?: unknown };

      if (session?.userId || session?.email) {
        const params = new URLSearchParams({
          ...(session.userId ? { userId: session.userId } : {}),
          ...(session.email ? { email: session.email } : {}),
        });
        const saveRes = await fetch(`/api/me/learning-guidance?${params}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(session.email ? { "x-user-email": session.email } : {}),
          },
          body: JSON.stringify(finalAnswers),
        });

        if (saveRes.ok) {
          data = await saveRes.json();
          setSaved(true);
        } else {
          const recommendRes = await fetch("/api/learning-guidance/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalAnswers),
          });
          if (!recommendRes.ok) throw new Error("Gagal menghitung rekomendasi.");
          const recommendData = await recommendRes.json();
          data = { result: recommendData };
          setSaved(false);
        }
      } else {
        const recommendRes = await fetch("/api/learning-guidance/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalAnswers),
        });
        if (!recommendRes.ok) throw new Error("Gagal menghitung rekomendasi.");
        data = { result: await recommendRes.json() };
        setSaved(false);
      }

      if (!data.result) throw new Error("Respons rekomendasi kosong.");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (!question) return;

    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    const missing = GUIDANCE_QUESTIONS.find(
      (q) => !isAnswered(answers, q.id, q.optional)
    );
    if (missing) {
      setError(`Lengkapi pertanyaan: ${missing.title}`);
      return;
    }

    void submitQuiz(answers as LearningGuidanceAnswers);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleSkipOptional() {
    if (!question?.optional) return;
    setAnswer(question.id, "prefer_not_say" as LearningGuidanceAnswers[typeof question.id]);
    handleNext();
  }

  function handleRetake() {
    setResult(null);
    setStep(0);
    setAnswers({});
    setSaved(false);
    setError(null);
  }

  if (result) {
    return (
      <GuidanceResults
        result={result}
        saved={saved}
        onRetake={handleRetake}
        isLoggedIn={Boolean(session?.userId || session?.email)}
      />
    );
  }

  if (!question) return null;

  const currentValue = answers[question.id];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-[env(safe-area-inset-bottom,0px)] sm:gap-6">
      {session ? (
        <Reveal>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              disabled={loadingProfile}
              onClick={() => void loadSavedProfile()}
            >
              {loadingProfile ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memuat…
                </>
              ) : (
                "Lihat rekomendasi tersimpan"
              )}
            </Button>
          </div>
        </Reveal>
      ) : null}

      <Reveal>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Langkah {step + 1} / {totalSteps}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
          <Progress
            value={progressPercent}
            className="h-1 overflow-hidden rounded-full bg-surface-2 [&_[data-slot=progress-indicator]]:bg-accent [&_[data-slot=progress-indicator]]:transition-all"
          />
        </div>
      </Reveal>

      <Reveal>
        <div className="surface-card flex flex-col gap-6 p-5 sm:gap-7 sm:p-8">
          <div className="space-y-2">
            <p className="eyebrow-tight flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden />
              Panduan Belajar
            </p>
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {question.title}
            </h2>
            <p className="section-copy">{question.subtitle}</p>
          </div>

          <div
            className="flex flex-col gap-2.5 sm:gap-3"
            role="group"
            aria-label={question.title}
          >
            {question.options.map((option) => (
              <GuidanceOptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={currentValue === option.value}
                onSelect={() =>
                  setAnswer(
                    question.id,
                    option.value as LearningGuidanceAnswers[typeof question.id]
                  )
                }
              />
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleBack}
              disabled={step === 0 || loading}
            >
              <ArrowLeft className="size-4" />
              Kembali
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {question.optional ? (
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={handleSkipOptional}
                  disabled={loading}
                >
                  Lewati
                </Button>
              ) : null}
              <Button
                className="btn-primary w-full sm:w-auto"
                onClick={handleNext}
                disabled={!canProceed || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menghitung…
                  </>
                ) : step === totalSteps - 1 ? (
                  <>
                    Lihat rekomendasi
                    <Sparkles className="size-4" />
                  </>
                ) : (
                  <>
                    Lanjut
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
