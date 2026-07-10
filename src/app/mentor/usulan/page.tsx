"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FilePlus2,
  Film,
  FolderOpen,
  Pencil,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminCourse, AdminLessonInput, AdminModuleInput } from "@/lib/admin/types";
import { canMutateMentor } from "@/lib/auth/roles";
import {
  createMentorChangeRequest,
  fetchMentorChangeRequests,
  fetchMentorCourses,
  type ChangeRequestDto,
} from "@/lib/mentor/api";
import { buildChangeDiff } from "@/lib/mentor/change-requests";

type TargetKind = "COURSE" | "MODULE" | "LESSON";
type ActionKind = "CREATE" | "UPDATE" | "DELETE";
type FlowMode = "browse" | "propose";

type LessonFormState = {
  title: string;
  description: string;
  durationMinutes: number;
  isPreviewGratis: boolean;
  videoUrl: string;
  sortOrder: number;
  moduleId: string;
};

const emptyLessonForm: LessonFormState = {
  title: "",
  description: "",
  durationMinutes: 10,
  isPreviewGratis: false,
  videoUrl: "",
  sortOrder: 0,
  moduleId: "",
};

function statusLabel(status: ChangeRequestDto["status"]) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "edited") return "Diedit & disetujui";
  return "Ditolak";
}

function statusVariant(status: ChangeRequestDto["status"]) {
  if (status === "pending") return "outline" as const;
  if (status === "approved" || status === "edited") return "accent" as const;
  return "destructive" as const;
}

function actionLabel(action: ActionKind) {
  if (action === "CREATE") return "Buat baru";
  if (action === "DELETE") return "Hapus";
  return "Perbarui";
}

function targetLabel(target: TargetKind) {
  if (target === "COURSE") return "Kelas";
  if (target === "MODULE") return "Modul";
  return "Pelajaran";
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return String(value);
}

function fieldLabel(key: string) {
  const map: Record<string, string> = {
    title: "Judul",
    shortDescription: "Deskripsi singkat",
    durationHours: "Durasi (jam)",
    description: "Deskripsi",
    durationMinutes: "Durasi (menit)",
    isPreviewGratis: "Preview gratis",
    videoUrl: "URL video",
    sortOrder: "Urutan",
    moduleId: "ID modul",
  };
  return map[key] ?? key;
}

export default function MentorUsulanPage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [requests, setRequests] = useState<ChangeRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [courseId, setCourseId] = useState("");
  const [mode, setMode] = useState<FlowMode>("browse");
  const [targetType, setTargetType] = useState<TargetKind>("LESSON");
  const [action, setAction] = useState<ActionKind>("UPDATE");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [summary, setSummary] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedForCourseId, setExpandedForCourseId] = useState("");

  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseHours, setCourseHours] = useState(0);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSortOrder, setModuleSortOrder] = useState(0);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) ?? null,
    [courses, courseId]
  );

  const modules: AdminModuleInput[] = selectedCourse?.modules ?? [];
  const selectedModule = modules.find((m) => m.id === moduleId) ?? null;
  const selectedLesson =
    modules.flatMap((m) => m.lessons.map((l) => ({ ...l, parentModuleId: m.id }))).find(
      (l) => l.id === lessonId
    ) ?? null;

  const currentSnapshot = useMemo(() => {
    if (action === "CREATE") return null;
    if (targetType === "COURSE" && selectedCourse) {
      return {
        title: selectedCourse.title,
        shortDescription: selectedCourse.shortDescription,
        durationHours: selectedCourse.durationHours,
      };
    }
    if (targetType === "MODULE" && selectedModule) {
      return {
        title: selectedModule.title,
        sortOrder: selectedModule.sortOrder ?? 0,
      };
    }
    if (targetType === "LESSON" && selectedLesson) {
      return {
        title: selectedLesson.title,
        description: selectedLesson.description ?? null,
        durationMinutes: selectedLesson.durationMinutes,
        isPreviewGratis: selectedLesson.isPreviewGratis ?? false,
        videoUrl: selectedLesson.videoUrl ?? null,
        sortOrder: selectedLesson.sortOrder ?? 0,
        moduleId: selectedLesson.parentModuleId,
      };
    }
    return null;
  }, [action, targetType, selectedCourse, selectedModule, selectedLesson]);

  const proposedPreview = useMemo(() => {
    if (action === "DELETE") return null;
    if (targetType === "COURSE") {
      return {
        title: courseTitle.trim(),
        shortDescription: courseDesc.trim(),
        durationHours: Number(courseHours) || 0,
      };
    }
    if (targetType === "MODULE") {
      return {
        title: moduleTitle.trim(),
        sortOrder: Number(moduleSortOrder) || 0,
      };
    }
    return {
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || null,
      durationMinutes: Number(lessonForm.durationMinutes) || 10,
      isPreviewGratis: lessonForm.isPreviewGratis,
      videoUrl: lessonForm.videoUrl.trim() || null,
      sortOrder: Number(lessonForm.sortOrder) || 0,
      moduleId: action === "CREATE" ? moduleId : lessonForm.moduleId || moduleId,
    };
  }, [
    action,
    targetType,
    courseTitle,
    courseDesc,
    courseHours,
    moduleTitle,
    moduleSortOrder,
    lessonForm,
    moduleId,
  ]);

  const diffRows = useMemo(
    () => buildChangeDiff(currentSnapshot, proposedPreview, action),
    [currentSnapshot, proposedPreview, action]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([
        fetchMentorCourses(),
        fetchMentorChangeRequests(),
      ]);
      setCourses(c);
      setRequests(r);
      setCourseId((prev) => {
        if (prev && c.some((x) => x.id === prev)) return prev;
        return c[0]?.id ?? "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedCourse || selectedCourse.id === expandedForCourseId) return;
    const expand: Record<string, boolean> = {};
    for (const m of selectedCourse.modules) {
      if (m.id) expand[m.id] = true;
    }
    setExpandedModules(expand);
    setExpandedForCourseId(selectedCourse.id);
  }, [selectedCourse, expandedForCourseId]);

  function resetProposeForm() {
    setSummary("");
    setSuccess(null);
    setError(null);
  }

  function startCourseUpdate() {
    if (!selectedCourse) return;
    resetProposeForm();
    setTargetType("COURSE");
    setAction("UPDATE");
    setModuleId("");
    setLessonId("");
    setCourseTitle(selectedCourse.title);
    setCourseDesc(selectedCourse.shortDescription);
    setCourseHours(selectedCourse.durationHours);
    setMode("propose");
  }

  function startModuleUpdate(mod: AdminModuleInput) {
    if (!mod.id) return;
    resetProposeForm();
    setTargetType("MODULE");
    setAction("UPDATE");
    setModuleId(mod.id);
    setLessonId("");
    setModuleTitle(mod.title);
    setModuleSortOrder(mod.sortOrder ?? 0);
    setMode("propose");
  }

  function startModuleCreate() {
    if (!selectedCourse) return;
    resetProposeForm();
    setTargetType("MODULE");
    setAction("CREATE");
    setModuleId("");
    setLessonId("");
    setModuleTitle(`Modul ${selectedCourse.modules.length + 1}`);
    setModuleSortOrder(selectedCourse.modules.length);
    setMode("propose");
  }

  function startModuleDelete(mod: AdminModuleInput) {
    if (!mod.id) return;
    resetProposeForm();
    setTargetType("MODULE");
    setAction("DELETE");
    setModuleId(mod.id);
    setLessonId("");
    setModuleTitle(mod.title);
    setModuleSortOrder(mod.sortOrder ?? 0);
    setMode("propose");
  }

  function startLessonUpdate(mod: AdminModuleInput, lesson: AdminLessonInput) {
    if (!mod.id || !lesson.id) return;
    resetProposeForm();
    setTargetType("LESSON");
    setAction("UPDATE");
    setModuleId(mod.id);
    setLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      durationMinutes: lesson.durationMinutes,
      isPreviewGratis: lesson.isPreviewGratis ?? false,
      videoUrl: lesson.videoUrl ?? "",
      sortOrder: lesson.sortOrder ?? 0,
      moduleId: mod.id,
    });
    setMode("propose");
  }

  function startLessonCreate(mod: AdminModuleInput) {
    if (!mod.id) return;
    resetProposeForm();
    setTargetType("LESSON");
    setAction("CREATE");
    setModuleId(mod.id);
    setLessonId("");
    setLessonForm({
      ...emptyLessonForm,
      sortOrder: mod.lessons.length,
      moduleId: mod.id,
    });
    setMode("propose");
  }

  function startLessonDelete(mod: AdminModuleInput, lesson: AdminLessonInput) {
    if (!mod.id || !lesson.id) return;
    resetProposeForm();
    setTargetType("LESSON");
    setAction("DELETE");
    setModuleId(mod.id);
    setLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      durationMinutes: lesson.durationMinutes,
      isPreviewGratis: lesson.isPreviewGratis ?? false,
      videoUrl: lesson.videoUrl ?? "",
      sortOrder: lesson.sortOrder ?? 0,
      moduleId: mod.id,
    });
    setMode("propose");
  }

  function buildProposedData(): Record<string, unknown> | null {
    if (action === "DELETE") return null;
    if (targetType === "COURSE") {
      return {
        title: courseTitle.trim(),
        shortDescription: courseDesc.trim(),
        durationHours: Number(courseHours) || 0,
      };
    }
    if (targetType === "MODULE") {
      return {
        title: moduleTitle.trim(),
        sortOrder: Number(moduleSortOrder) || 0,
      };
    }
    return {
      title: lessonForm.title.trim(),
      description: lessonForm.description.trim() || null,
      durationMinutes: Number(lessonForm.durationMinutes) || 10,
      isPreviewGratis: lessonForm.isPreviewGratis,
      videoUrl: lessonForm.videoUrl.trim() || null,
      sortOrder: Number(lessonForm.sortOrder) || 0,
      moduleId: action === "CREATE" ? moduleId : lessonForm.moduleId || moduleId,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createMentorChangeRequest({
        courseId,
        targetType,
        action,
        moduleId:
          targetType === "COURSE"
            ? null
            : targetType === "MODULE" && action === "CREATE"
              ? null
              : moduleId || null,
        lessonId: targetType === "LESSON" && action !== "CREATE" ? lessonId || null : null,
        summary: summary.trim(),
        proposedData: buildProposedData(),
      });
      setSuccess("Usulan terkirim. Menunggu review admin.");
      setSummary("");
      setMode("browse");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim usulan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const selectionTitle =
    targetType === "COURSE"
      ? selectedCourse?.title
      : targetType === "MODULE"
        ? selectedModule?.title ?? moduleTitle
        : selectedLesson?.title ?? lessonForm.title;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Usulan Perubahan Konten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih kelas → buka kurikulum → usulkan ubah/hapus lesson atau modul yang sudah ada,
          atau tambah konten baru. Admin yang menyetujui dan menerapkan ke data live.
          {readOnly && " Mode QC: hanya melihat."}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      )}

      <div className="surface-card space-y-3 p-4">
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted-foreground">Kelas yang Anda ampu</span>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 sm:max-w-md"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setMode("browse");
              setModuleId("");
              setLessonId("");
            }}
          >
            {courses.length === 0 && <option value="">Belum ada kelas</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {selectedCourse && (
          <p className="text-xs text-muted-foreground">
            {selectedCourse.modules.length} modul ·{" "}
            {selectedCourse.modules.reduce((n, m) => n + m.lessons.length, 0)} pelajaran
          </p>
        )}
      </div>

      {!readOnly && mode === "browse" && selectedCourse && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">Kurikulum saat ini</h2>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={startCourseUpdate}>
                <BookOpen className="size-4" />
                Ubah metadata kelas
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={startModuleCreate}>
                <FilePlus2 className="size-4" />
                Usulkan modul baru
              </Button>
            </div>
          </div>

          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada modul. Ajukan modul baru terlebih dahulu.
            </p>
          ) : (
            <ul className="space-y-3">
              {modules.map((mod) => {
                const mid = mod.id!;
                const open = expandedModules[mid] ?? true;
                return (
                  <li key={mid} className="surface-card overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        onClick={() =>
                          setExpandedModules((prev) => ({ ...prev, [mid]: !open }))
                        }
                      >
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{mod.title}</span>
                        <Badge variant="outline">#{mod.sortOrder ?? 0}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {mod.lessons.length} pelajaran
                        </span>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startModuleUpdate(mod)}
                        >
                          <Pencil className="size-3.5" />
                          Ubah
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startLessonCreate(mod)}
                        >
                          <FilePlus2 className="size-3.5" />
                          Lesson
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startModuleDelete(mod)}
                        >
                          <Trash2 className="size-3.5" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                    {open && (
                      <ul className="divide-y divide-border/40">
                        {mod.lessons.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-muted-foreground">
                            Belum ada pelajaran di modul ini.
                          </li>
                        ) : (
                          mod.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex flex-wrap items-start gap-2 px-4 py-3 sm:items-center"
                            >
                              <Film className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.durationMinutes} mnt
                                  {lesson.isPreviewGratis ? " · preview gratis" : ""}
                                  {lesson.videoUrl ? " · ada video" : " · belum ada video"}
                                  {" · urutan "}
                                  {lesson.sortOrder ?? 0}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startLessonUpdate(mod, lesson)}
                                >
                                  <Pencil className="size-3.5" />
                                  Usulkan ubah
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startLessonDelete(mod, lesson)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {!readOnly && mode === "propose" && selectedCourse && (
        <form onSubmit={handleSubmit} className="surface-card space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{actionLabel(action)}</Badge>
                <Badge variant="outline">{targetLabel(targetType)}</Badge>
              </div>
              <h2 className="mt-2 font-heading text-lg font-semibold">
                {selectionTitle || "Usulan baru"}
              </h2>
              <p className="text-sm text-muted-foreground">{selectedCourse.title}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setMode("browse")}>
              Kembali ke kurikulum
            </Button>
          </div>

          {action === "DELETE" && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Anda mengusulkan penghapusan. Admin harus menyetujui sebelum konten dihapus dari
              kelas live.
            </p>
          )}

          {action !== "DELETE" && targetType === "COURSE" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">Judul kelas</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">Deskripsi singkat</span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">Durasi (jam)</span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={courseHours}
                  onChange={(e) => setCourseHours(Number(e.target.value))}
                />
              </label>
            </div>
          )}

          {action !== "DELETE" && targetType === "MODULE" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">Judul modul</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">Urutan</span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={moduleSortOrder}
                  onChange={(e) => setModuleSortOrder(Number(e.target.value))}
                />
              </label>
            </div>
          )}

          {action !== "DELETE" && targetType === "LESSON" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">Judul pelajaran</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">Deskripsi</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={lessonForm.description}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">Durasi (menit)</span>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={lessonForm.durationMinutes}
                  onChange={(e) =>
                    setLessonForm((f) => ({
                      ...f,
                      durationMinutes: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">Urutan</span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={lessonForm.sortOrder}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
                  }
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block text-muted-foreground">URL video</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
              {action === "UPDATE" && (
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1.5 block text-muted-foreground">Pindah ke modul</span>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    value={lessonForm.moduleId}
                    onChange={(e) =>
                      setLessonForm((f) => ({ ...f, moduleId: e.target.value }))
                    }
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {action === "CREATE" && (
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1.5 block text-muted-foreground">Modul induk</span>
                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                    value={moduleId}
                    onChange={(e) => {
                      setModuleId(e.target.value);
                      setLessonForm((f) => ({ ...f, moduleId: e.target.value }));
                    }}
                    required
                  >
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={lessonForm.isPreviewGratis}
                  onChange={(e) =>
                    setLessonForm((f) => ({ ...f, isPreviewGratis: e.target.checked }))
                  }
                />
                Preview gratis
              </label>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-medium">Sebelum → sesudah</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-border text-xs font-medium text-muted-foreground">
                <div className="bg-background px-3 py-2">Field</div>
                <div className="bg-background px-3 py-2">Saat ini</div>
                <div className="bg-background px-3 py-2">Usulan</div>
              </div>
              {diffRows.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">Tidak ada data.</p>
              ) : (
                diffRows.map((row) => (
                  <div
                    key={row.key}
                    className={`grid grid-cols-[1fr_1fr_1fr] gap-px bg-border text-sm ${
                      row.changed ? "bg-amber-500/10" : ""
                    }`}
                  >
                    <div className="bg-background px-3 py-2 text-muted-foreground">
                      {fieldLabel(row.key)}
                    </div>
                    <div className="break-all bg-background px-3 py-2">
                      {formatValue(row.before)}
                    </div>
                    <div
                      className={`break-all bg-background px-3 py-2 ${
                        row.changed ? "font-medium text-amber-700 dark:text-amber-300" : ""
                      }`}
                    >
                      {formatValue(row.after)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Ringkasan untuk admin</span>
            <textarea
              className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              placeholder="Jelaskan mengapa perubahan ini diperlukan..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || !courses.length}>
              {action === "CREATE" ? (
                <FilePlus2 className="size-4" />
              ) : action === "DELETE" ? (
                <Trash2 className="size-4" />
              ) : (
                <Pencil className="size-4" />
              )}
              {saving ? "Mengirim..." : "Kirim usulan"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setMode("browse")}>
              Batal
            </Button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Riwayat usulan</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada usulan.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((req) => {
              const rows = buildChangeDiff(
                req.currentSnapshot,
                req.proposedData,
                req.action
              ).filter((r) => r.changed);
              return (
                <li key={req.id} className="surface-card space-y-2 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{req.courseTitle}</p>
                        <Badge variant="outline">{actionLabel(req.action)}</Badge>
                        <Badge variant="outline">{targetLabel(req.targetType)}</Badge>
                        <Badge variant={statusVariant(req.status)}>
                          {statusLabel(req.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{req.summary}</p>
                      {req.adminNote && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Catatan admin: {req.adminNote}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  {rows.length > 0 && (
                    <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                      {rows.slice(0, 4).map((r) => (
                        <p key={r.key} className="truncate">
                          <span className="text-muted-foreground">{fieldLabel(r.key)}:</span>{" "}
                          {formatValue(r.before)} → {formatValue(r.after)}
                        </p>
                      ))}
                      {rows.length > 4 && (
                        <p className="text-muted-foreground">+{rows.length - 4} field lain</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
