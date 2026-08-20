"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AuthField, authInputClassName } from "@/components/auth-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  L1_EXPERTISE_OPTIONS,
  L1_YEARS_OPTIONS,
  L2_CLAIMS_EVIDENCE_OPTIONS,
  L2_SECTIONS,
  L2_TARGET_STUDENT_OPTIONS,
  L2_TAUGHT_WHO_OPTIONS,
  type L1ExpertiseValue,
} from "@/lib/mentor-program/fields";
import type { MentorApplicationRecord } from "@/lib/mentor-program/types";
import { cn } from "@/lib/utils";
import type { MentorL2DraftInput } from "@/lib/validations/mentor-application";

const textareaClassName =
  "w-full resize-y rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none min-h-[110px]";

function emptyAnswers(prefillYears?: string): MentorL2DraftInput {
  const years = L1_YEARS_OPTIONS.some((option) => option.value === prefillYears)
    ? (prefillYears as MentorL2DraftInput["l2_years_experience"])
    : undefined;
  return {
    l2_years_experience: years,
    l2_previous_roles: [],
    l2_markets: [],
    l2_certifications: [],
    l2_publications: [],
    l2_taught_who: [],
    l2_target_student: [],
    l2_course_outline: [{ title: "" }, { title: "" }, { title: "" }],
    l2_accuracy_confirmation: false,
    l2_review_confirmation: false,
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

const EXPERTISE_VALUES = new Set(L1_EXPERTISE_OPTIONS.map((option) => option.value));

function asExpertiseList(value: unknown): L1ExpertiseValue[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is L1ExpertiseValue =>
      typeof item === "string" && EXPERTISE_VALUES.has(item as L1ExpertiseValue)
  );
}

function mergeL2Answers(
  l1: Record<string, unknown>,
  existing: MentorL2DraftInput
): MentorL2DraftInput {
  const years = asString(l1.l1_years_experience);
  const base = emptyAnswers(years);
  const l1Markets = asExpertiseList(l1.l1_expertise);
  const latar = asString(l1.l1_professional_background);
  const merged: MentorL2DraftInput = {
    ...base,
    ...existing,
    l2_previous_roles: existing.l2_previous_roles ?? [],
    l2_certifications: existing.l2_certifications ?? [],
    l2_publications: existing.l2_publications ?? [],
    l2_course_outline:
      existing.l2_course_outline && existing.l2_course_outline.length >= 3
        ? existing.l2_course_outline
        : base.l2_course_outline,
  };
  if (!merged.l2_years_experience && years) {
    merged.l2_years_experience = years as MentorL2DraftInput["l2_years_experience"];
  }
  if (!merged.l2_markets?.length && l1Markets.length) {
    merged.l2_markets = l1Markets;
  }
  if (!merged.l2_achievements?.trim() && latar) {
    merged.l2_achievements = latar;
  }
  return merged;
}

export function MentorL2ApplicationForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [application, setApplication] = useState<MentorApplicationRecord | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [answers, setAnswers] = useState<MentorL2DraftInput>(emptyAnswers());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<(typeof L2_SECTIONS)[number]["id"]>("background");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mentor/applications/l2/${token}`);
        const data = (await res.json()) as {
          application?: MentorApplicationRecord;
          readOnly?: boolean;
          error?: string;
        };
        if (!res.ok || !data.application) {
          throw new Error(data.error ?? "Tautan tidak valid.");
        }
        if (cancelled) return;
        setApplication(data.application);
        setReadOnly(Boolean(data.readOnly));
        const existing = (data.application.l2Answers ?? {}) as MentorL2DraftInput;
        setAnswers(mergeL2Answers(data.application.l1Answers, existing));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Gagal memuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function persist(intent: "draft" | "submit") {
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: MentorL2DraftInput = {
      ...answers,
      l2_previous_roles: (answers.l2_previous_roles ?? []).filter(
        (role) => role.role.trim() && role.organization.trim()
      ),
      l2_certifications: (answers.l2_certifications ?? []).filter((item) => item.label.trim()),
      l2_publications: (answers.l2_publications ?? []).filter((url) => url.trim()),
    };
    try {
      const res = await fetch(`/api/mentor/applications/l2/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, answers: payload }),
      });
      const data = (await res.json()) as { error?: string; application?: MentorApplicationRecord };
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");
      if (data.application) setApplication(data.application);
      if (intent === "submit") {
        setReadOnly(true);
        setMessage("Aplikasi tahap 2 sudah diterima.");
      } else {
        setMessage("Draf tersimpan.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat portal...
      </div>
    );
  }

  if (loadError || !application) {
    return <p className="text-sm text-destructive">{loadError ?? "Tautan tidak valid."}</p>;
  }

  const l1 = application.l1Answers;
  const disabled = readOnly || saving;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-border/60 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{application.status}</Badge>
          {readOnly ? <Badge variant="secondary">Hanya baca</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {asString(l1.l1_full_name) || application.fullName} · {application.email}
          {asString(l1.l1_city) ? ` · ${asString(l1.l1_city)}, ${asString(l1.l1_country)}` : ""}
        </p>
        {asString(l1.l1_linkedin_url) ? (
          <p className="mt-1 text-xs">
            <a href={asString(l1.l1_linkedin_url)} className="underline" target="_blank" rel="noreferrer">
              {asString(l1.l1_linkedin_url)}
            </a>
          </p>
        ) : null}
        {Array.isArray(l1.l1_expertise) && l1.l1_expertise.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Keahlian L1 (boleh diperhalus di Domain): {l1.l1_expertise.join(", ")}
            {asString(l1.l1_primary_expertise) ? ` · utama ${asString(l1.l1_primary_expertise)}` : ""}
            {asString(l1.l1_years_experience) ? ` · ${asString(l1.l1_years_experience)}` : ""}
          </p>
        ) : null}
        {asString(l1.l1_professional_background) ? (
          <p className="mt-3 text-sm">
            <span className="text-xs text-muted-foreground">Latar L1 — diperhalus di capaian di bawah. </span>
            {asString(l1.l1_professional_background)}
          </p>
        ) : null}
        {asString(l1.l1_why_bursanalar) ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Mengapa Bursanalar (L1): </span>
            {asString(l1.l1_why_bursanalar)}
          </p>
        ) : null}
        {asString(l1.l1_unique_knowledge) ? (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pengetahuan unik (L1): </span>
            {asString(l1.l1_unique_knowledge)}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-wrap gap-2">
        {L2_SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              section === item.id ? "border-primary bg-primary/10" : "border-border"
            )}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {section === "background" ? (
        <section className="flex flex-col gap-4">
          <AuthField label="Peran saat ini / terakhir" id="l2_current_role">
            <input
              id="l2_current_role"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_current_role ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_current_role: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Organisasi / perusahaan" id="l2_organization">
            <input
              id="l2_organization"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_organization ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_organization: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Lama pengalaman relevan" id="l2_years_experience">
            <select
              id="l2_years_experience"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_years_experience ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  l2_years_experience: event.target.value as MentorL2DraftInput["l2_years_experience"],
                }))
              }
            >
              <option value="">Pilih</option>
              {L1_YEARS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AuthField>
          <AuthField label="Capaian profesional" id="l2_achievements">
            <textarea
              id="l2_achievements"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_achievements ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_achievements: event.target.value }))
              }
            />
          </AuthField>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Peran sebelumnya (opsional)</p>
            {(answers.l2_previous_roles ?? []).map((role, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-border/60 p-3 sm:grid-cols-2">
                <input
                  id={`l2_previous_roles_${index}_role`}
                  disabled={disabled}
                  className={authInputClassName}
                  placeholder="Peran"
                  value={role.role}
                  onChange={(event) =>
                    setAnswers((prev) => {
                      const next = [...(prev.l2_previous_roles ?? [])];
                      next[index] = { ...next[index], role: event.target.value };
                      return { ...prev, l2_previous_roles: next };
                    })
                  }
                />
                <input
                  id={`l2_previous_roles_${index}_organization`}
                  disabled={disabled}
                  className={authInputClassName}
                  placeholder="Organisasi"
                  value={role.organization}
                  onChange={(event) =>
                    setAnswers((prev) => {
                      const next = [...(prev.l2_previous_roles ?? [])];
                      next[index] = { ...next[index], organization: event.target.value };
                      return { ...prev, l2_previous_roles: next };
                    })
                  }
                />
              </div>
            ))}
            {!disabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    l2_previous_roles: [
                      ...(prev.l2_previous_roles ?? []),
                      { role: "", organization: "", start_year: new Date().getFullYear() },
                    ],
                  }))
                }
              >
                Tambah peran
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {section === "domain" ? (
        <section className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Pasar / domain</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {L1_EXPERTISE_OPTIONS.map((option) => {
                const checked = answers.l2_markets?.includes(option.value) ?? false;
                return (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={checked}
                      onChange={() =>
                        setAnswers((prev) => {
                          const current = prev.l2_markets ?? [];
                          return {
                            ...prev,
                            l2_markets: checked
                              ? current.filter((item) => item !== option.value)
                              : [...current, option.value],
                          };
                        })
                      }
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {answers.l2_markets?.includes("other") ? (
            <AuthField label="Jelaskan domain lainnya" id="l2_markets_other">
              <input
                id="l2_markets_other"
                disabled={disabled}
                className={authInputClassName}
                value={answers.l2_markets_other ?? ""}
                onChange={(event) =>
                  setAnswers((prev) => ({ ...prev, l2_markets_other: event.target.value }))
                }
              />
            </AuthField>
          ) : null}
          <AuthField label="Subjek yang bisa kamu ajar" id="l2_teachable_subjects">
            <textarea
              id="l2_teachable_subjects"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_teachable_subjects ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_teachable_subjects: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Pendekatanmu" id="l2_approach">
            <textarea
              id="l2_approach"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_approach ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_approach: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Apa yang membedakan pendekatanmu?" id="l2_differentiator">
            <textarea
              id="l2_differentiator"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_differentiator ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_differentiator: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Kapan pendekatanmu tidak bekerja?" id="l2_limitations">
            <textarea
              id="l2_limitations"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_limitations ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_limitations: event.target.value }))
              }
            />
          </AuthField>
        </section>
      ) : null}

      {section === "evidence" ? (
        <section className="flex flex-col gap-4">
          <AuthField label="Tautan CV / resume" id="l2_cv_url">
            <input
              id="l2_cv_url"
              type="url"
              disabled={disabled}
              className={authInputClassName}
              placeholder="https://drive.google.com/..."
              value={answers.l2_cv_url ?? ""}
              onChange={(event) => setAnswers((prev) => ({ ...prev, l2_cv_url: event.target.value }))}
            />
          </AuthField>
          <AuthField label="Bukti lain" id="l2_other_evidence">
            <textarea
              id="l2_other_evidence"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_other_evidence ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_other_evidence: event.target.value }))
              }
            />
          </AuthField>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Sertifikasi (opsional)</p>
            {(answers.l2_certifications ?? []).map((item, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <input
                  id={`l2_certifications_${index}_label`}
                  disabled={disabled}
                  className={authInputClassName}
                  placeholder="Nama sertifikasi"
                  value={item.label}
                  onChange={(event) =>
                    setAnswers((prev) => {
                      const next = [...(prev.l2_certifications ?? [])];
                      next[index] = { ...next[index], label: event.target.value };
                      return { ...prev, l2_certifications: next };
                    })
                  }
                />
                <input
                  id={`l2_certifications_${index}_url`}
                  type="url"
                  disabled={disabled}
                  className={authInputClassName}
                  placeholder="https://"
                  value={item.url ?? ""}
                  onChange={(event) =>
                    setAnswers((prev) => {
                      const next = [...(prev.l2_certifications ?? [])];
                      next[index] = { ...next[index], url: event.target.value };
                      return { ...prev, l2_certifications: next };
                    })
                  }
                />
              </div>
            ))}
            {!disabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    l2_certifications: [...(prev.l2_certifications ?? []), { label: "" }],
                  }))
                }
              >
                Tambah sertifikasi
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Publikasi / karya (URL, opsional)</p>
            {(answers.l2_publications ?? []).map((url, index) => (
              <input
                key={index}
                id={`l2_publications_${index}`}
                type="url"
                disabled={disabled}
                className={authInputClassName}
                placeholder="https://"
                value={url}
                onChange={(event) =>
                  setAnswers((prev) => {
                    const next = [...(prev.l2_publications ?? [])];
                    next[index] = event.target.value;
                    return { ...prev, l2_publications: next };
                  })
                }
              />
            ))}
            {!disabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    l2_publications: [...(prev.l2_publications ?? []), ""],
                  }))
                }
              >
                Tambah tautan publikasi
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {section === "teaching" ? (
        <section className="flex flex-col gap-4">
          <AuthField label="Pernah mengajar atau mentoring?" id="l2_has_taught">
            <select
              id="l2_has_taught"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_has_taught == null ? "" : answers.l2_has_taught ? "yes" : "no"}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  l2_has_taught: event.target.value === "" ? undefined : event.target.value === "yes",
                }))
              }
            >
              <option value="">Pilih</option>
              <option value="yes">Ya</option>
              <option value="no">Tidak</option>
            </select>
          </AuthField>
          {answers.l2_has_taught ? (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Siapa yang diajar?</legend>
                {L2_TAUGHT_WHO_OPTIONS.map((option) => {
                  const checked = answers.l2_taught_who?.includes(option.value) ?? false;
                  return (
                    <label key={option.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        onChange={() =>
                          setAnswers((prev) => {
                            const current = prev.l2_taught_who ?? [];
                            return {
                              ...prev,
                              l2_taught_who: checked
                                ? current.filter((item) => item !== option.value)
                                : [...current, option.value],
                            };
                          })
                        }
                      />
                      {option.label}
                    </label>
                  );
                })}
              </fieldset>
              <AuthField label="Deskripsi pengalaman mengajar" id="l2_teaching_experience">
                <textarea
                  id="l2_teaching_experience"
                  disabled={disabled}
                  className={textareaClassName}
                  value={answers.l2_teaching_experience ?? ""}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, l2_teaching_experience: event.target.value }))
                  }
                />
              </AuthField>
            </>
          ) : null}
          <AuthField label="Apa yang membuat seseorang murid yang cocok untukmu?" id="l2_good_student">
            <textarea
              id="l2_good_student"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_good_student ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_good_student: event.target.value }))
              }
            />
          </AuthField>
        </section>
      ) : null}

      {section === "sample" ? (
        <AuthField
          label="Tautan sampel mengajar (5–10 menit, unlisted/Loom/Drive)"
          id="l2_teaching_sample_url"
        >
          <input
            id="l2_teaching_sample_url"
            type="url"
            disabled={disabled}
            className={authInputClassName}
            placeholder="https://"
            value={answers.l2_teaching_sample_url ?? ""}
            onChange={(event) =>
              setAnswers((prev) => ({ ...prev, l2_teaching_sample_url: event.target.value }))
            }
          />
        </AuthField>
      ) : null}

      {section === "course" ? (
        <section className="flex flex-col gap-4">
          <AuthField label="Judul usulan kursus" id="l2_course_title">
            <input
              id="l2_course_title"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_course_title ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_course_title: event.target.value }))
              }
            />
          </AuthField>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Target murid</legend>
            {L2_TARGET_STUDENT_OPTIONS.map((option) => {
              const checked = answers.l2_target_student?.includes(option.value) ?? false;
              return (
                <label key={option.value} className="mr-4 inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={checked}
                    onChange={() =>
                      setAnswers((prev) => {
                        const current = prev.l2_target_student ?? [];
                        return {
                          ...prev,
                          l2_target_student: checked
                            ? current.filter((item) => item !== option.value)
                            : [...current, option.value],
                        };
                      })
                    }
                  />
                  {option.label}
                </label>
              );
            })}
          </fieldset>
          <AuthField label="Masalah yang diselesaikan" id="l2_course_problem">
            <textarea
              id="l2_course_problem"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_course_problem ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_course_problem: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Outcome konkret (3–5)" id="l2_learning_outcomes">
            <textarea
              id="l2_learning_outcomes"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_learning_outcomes ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_learning_outcomes: event.target.value }))
              }
            />
          </AuthField>
          <AuthField label="Mengapa kursus ini perlu ada?" id="l2_course_differentiator">
            <textarea
              id="l2_course_differentiator"
              disabled={disabled}
              className={textareaClassName}
              value={answers.l2_course_differentiator ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_course_differentiator: event.target.value }))
              }
            />
          </AuthField>
          {(answers.l2_course_outline ?? []).map((module, index) => (
            <AuthField key={index} label={`Modul ${index + 1}`} id={`outline-${index}`}>
              <input
                id={`outline-${index}`}
                disabled={disabled}
                className={authInputClassName}
                value={module.title}
                onChange={(event) =>
                  setAnswers((prev) => {
                    const outline = [...(prev.l2_course_outline ?? [])];
                    outline[index] = { title: event.target.value };
                    return { ...prev, l2_course_outline: outline };
                  })
                }
              />
            </AuthField>
          ))}
        </section>
      ) : null}

      {section === "integrity" ? (
        <section className="flex flex-col gap-4">
          <YesNo
            id="l2_has_financial_relationships"
            label="Ada relasi finansial/profesional relevan?"
            value={answers.l2_has_financial_relationships}
            disabled={disabled}
            onChange={(value) =>
              setAnswers((prev) => ({ ...prev, l2_has_financial_relationships: value }))
            }
          />
          {answers.l2_has_financial_relationships ? (
            <textarea
              disabled={disabled}
              className={textareaClassName}
              placeholder="Jelaskan"
              value={answers.l2_financial_relationships_explain ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  l2_financial_relationships_explain: event.target.value,
                }))
              }
            />
          ) : null}
          <YesNo
            id="l2_sells_signals"
            label="Menjual sinyal, langganan, atau jasa serupa?"
            value={answers.l2_sells_signals}
            disabled={disabled}
            onChange={(value) => setAnswers((prev) => ({ ...prev, l2_sells_signals: value }))}
          />
          {answers.l2_sells_signals ? (
            <textarea
              disabled={disabled}
              className={textareaClassName}
              placeholder="Jelaskan"
              value={answers.l2_sells_signals_explain ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_sells_signals_explain: event.target.value }))
              }
            />
          ) : null}
          <YesNo
            id="l2_has_conflicts"
            label="Ada konflik kepentingan yang perlu diketahui?"
            value={answers.l2_has_conflicts}
            disabled={disabled}
            onChange={(value) => setAnswers((prev) => ({ ...prev, l2_has_conflicts: value }))}
          />
          {answers.l2_has_conflicts ? (
            <textarea
              disabled={disabled}
              className={textareaClassName}
              placeholder="Jelaskan"
              value={answers.l2_conflicts_explain ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_conflicts_explain: event.target.value }))
              }
            />
          ) : null}
          <AuthField label="Klaim performa didukung bukti terverifikasi?" id="l2_claims_evidence">
            <select
              id="l2_claims_evidence"
              disabled={disabled}
              className={authInputClassName}
              value={answers.l2_claims_evidence ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  l2_claims_evidence: event.target.value as MentorL2DraftInput["l2_claims_evidence"],
                }))
              }
            >
              <option value="">Pilih</option>
              {L2_CLAIMS_EVIDENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </AuthField>
        </section>
      ) : null}

      {section === "confirm" ? (
        <section className="flex flex-col gap-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(answers.l2_accuracy_confirmation)}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_accuracy_confirmation: event.target.checked }))
              }
            />
            Saya menyatakan informasi, tautan, dan materi yang dikirim akurat sepanjang pengetahuan
            saya.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(answers.l2_review_confirmation)}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, l2_review_confirmation: event.target.checked }))
              }
            />
            Saya memahami Bursanalar dapat meninjau informasi dan materi ini untuk seleksi mentor.
          </label>
        </section>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      {!readOnly ? (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void persist("draft")}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan draf
          </Button>
          <Button type="button" className="btn-primary" disabled={saving} onClick={() => void persist("submit")}>
            Kirim tahap 2
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function YesNo({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | undefined;
  disabled: boolean;
  onChange: (value: boolean | undefined) => void;
}) {
  return (
    <AuthField label={label} id={id}>
      <select
        id={id}
        disabled={disabled}
        className={authInputClassName}
        value={value == null ? "" : value ? "yes" : "no"}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : event.target.value === "yes")
        }
      >
        <option value="">Pilih</option>
        <option value="yes">Ya</option>
        <option value="no">Tidak</option>
      </select>
    </AuthField>
  );
}
