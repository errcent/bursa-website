"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Film,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { ConfirmDialog, FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  fetchCourse,
  reorderCurriculum,
  updateLesson,
  updateModule,
} from "@/lib/admin/api";
import { getSession } from "@/lib/auth/client";
import type {
  AdminCourse,
  AdminLessonInput,
  AdminModuleInput,
  LessonFormInput,
} from "@/lib/admin/types";

const emptyLessonForm: LessonFormInput = {
  title: "",
  description: "",
  durationMinutes: 10,
  isPreviewGratis: false,
  videoUrl: "",
};

type Props = {
  courseId: string;
};

export function CurriculumManager({ courseId }: Props) {
  const { toast } = useAdminToast();
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [editingModule, setEditingModule] = useState<AdminModuleInput | null>(null);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonFormInput>(emptyLessonForm);
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<AdminLessonInput | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "module"; moduleId: string; title: string }
    | { type: "lesson"; moduleId: string; lessonId: string; title: string }
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCourse(courseId);
      setCourse(res.data);
    } catch {
      toast("Gagal memuat kurikulum.", "error");
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateModule() {
    setEditingModule(null);
    setModuleTitle(`Modul ${(course?.modules.length ?? 0) + 1}`);
    setModuleModalOpen(true);
  }

  function openEditModule(mod: AdminModuleInput) {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleModalOpen(true);
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setSaving(true);
    try {
      if (editingModule?.id) {
        await updateModule(courseId, editingModule.id, { title: moduleTitle.trim() });
        toast("Modul diperbarui.");
      } else {
        await createModule(courseId, { title: moduleTitle.trim() });
        toast("Modul ditambahkan.");
      }
      setModuleModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan modul.", "error");
    } finally {
      setSaving(false);
    }
  }

  function openCreateLesson(moduleId: string) {
    setLessonModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm(emptyLessonForm);
    setLessonModalOpen(true);
  }

  function openEditLesson(moduleId: string, lesson: AdminLessonInput) {
    setLessonModuleId(moduleId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      durationMinutes: lesson.durationMinutes,
      isPreviewGratis: lesson.isPreviewGratis ?? false,
      videoUrl: lesson.videoUrl ?? "",
      moduleId,
    });
    setLessonModalOpen(true);
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonModuleId || !lessonForm.title.trim()) return;
    setSaving(true);
    try {
      const payload: LessonFormInput = {
        title: lessonForm.title.trim(),
        description: lessonForm.description?.trim() || null,
        durationMinutes: lessonForm.durationMinutes,
        isPreviewGratis: lessonForm.isPreviewGratis ?? false,
        videoUrl: lessonForm.videoUrl?.trim() || null,
        moduleId: lessonForm.moduleId,
      };

      if (editingLesson?.id) {
        await updateLesson(courseId, lessonModuleId, editingLesson.id, payload);
        toast("Lesson diperbarui.");
      } else {
        await createLesson(courseId, lessonModuleId, payload);
        toast("Lesson ditambahkan.");
      }
      setLessonModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan lesson.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "module") {
        await deleteModule(courseId, deleteTarget.moduleId);
        toast("Modul dihapus.");
      } else {
        await deleteLesson(courseId, deleteTarget.moduleId, deleteTarget.lessonId);
        toast("Lesson dihapus.");
      }
      setDeleteTarget(null);
      await load();
    } catch {
      toast("Gagal menghapus.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function moveModule(index: number, direction: -1 | 1) {
    if (!course) return;
    const target = index + direction;
    if (target < 0 || target >= course.modules.length) return;

    const modules = [...course.modules];
    const [item] = modules.splice(index, 1);
    modules.splice(target, 0, item);

    setSaving(true);
    try {
      const res = await reorderCurriculum(courseId, {
        modules: modules.map((mod, i) => ({
          id: mod.id!,
          sortOrder: i,
          lessons: mod.lessons.map((lesson, li) => ({
            id: lesson.id!,
            sortOrder: lesson.sortOrder ?? li,
          })),
        })),
      });
      setCourse(res.data);
      toast("Urutan modul diperbarui.");
    } catch {
      toast("Gagal mengubah urutan modul.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function moveLesson(moduleId: string, lessonIndex: number, direction: -1 | 1) {
    if (!course) return;
    const modIndex = course.modules.findIndex((m) => m.id === moduleId);
    if (modIndex < 0) return;
    const lessons = [...course.modules[modIndex].lessons];
    const target = lessonIndex + direction;
    if (target < 0 || target >= lessons.length) return;

    const [item] = lessons.splice(lessonIndex, 1);
    lessons.splice(target, 0, item);

    const modules = course.modules.map((mod, i) =>
      i === modIndex ? { ...mod, lessons } : mod
    );

    setSaving(true);
    try {
      const res = await reorderCurriculum(courseId, {
        modules: modules.map((mod, i) => ({
          id: mod.id!,
          sortOrder: mod.sortOrder ?? i,
          lessons: mod.lessons.map((lesson, li) => ({
            id: lesson.id!,
            sortOrder: li,
          })),
        })),
      });
      setCourse(res.data);
      toast("Urutan lesson diperbarui.");
    } catch {
      toast("Gagal mengubah urutan lesson.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-xl" />;
  if (!course) {
    return (
      <div className="surface-card space-y-3 p-6">
        <p className="text-sm text-muted-foreground">Kelas tidak ditemukan.</p>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/admin/courses" />}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Manajemen Kelas
          </Link>
          <h1 className="font-heading text-2xl font-semibold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Kelola modul, lesson, video URL, durasi, preview, dan urutan konten.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">{course.modules.length} modul</Badge>
            <Badge variant="outline">{totalLessons} lesson</Badge>
            <Badge variant={course.isPublished ? "accent" : "outline"}>
              {course.isPublished ? "Publik" : "Draft"}
            </Badge>
          </div>
        </div>
        <Button size="sm" onClick={openCreateModule}>
          <Plus className="size-4" />
          Tambah Modul
        </Button>
      </div>

      {course.modules.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 border-dashed py-16 text-center">
          <Film className="size-8 text-muted-foreground" />
          <div>
            <p className="font-heading font-medium">Belum ada modul</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat modul pertama, lalu tambahkan lesson dan video URL.
            </p>
          </div>
          <Button size="sm" onClick={openCreateModule}>
            <Plus className="size-4" />
            Tambah Modul
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod, mi) => (
            <section key={mod.id ?? mi} className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/8 bg-[#12151d]/60 px-4 py-3">
                <GripVertical className="size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-sm font-semibold">{mod.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {mod.lessons.length} lesson · urutan {mi + 1}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={saving || mi === 0}
                    onClick={() => moveModule(mi, -1)}
                    aria-label="Naikkan modul"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={saving || mi === course.modules.length - 1}
                    onClick={() => moveModule(mi, 1)}
                    aria-label="Turunkan modul"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEditModule(mod)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      setDeleteTarget({
                        type: "module",
                        moduleId: mod.id!,
                        title: mod.title,
                      })
                    }
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => openCreateLesson(mod.id!)}>
                    <Plus className="size-3" />
                    Lesson
                  </Button>
                </div>
              </div>

              <div className="divide-y divide-white/6">
                {mod.lessons.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada lesson di modul ini.
                  </div>
                ) : (
                  mod.lessons.map((lesson, li) => (
                    <div
                      key={lesson.id ?? li}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.isPreviewGratis && (
                            <Badge variant="accent">Preview gratis</Badge>
                          )}
                          {!lesson.videoUrl && (
                            <Badge variant="outline">Tanpa video</Badge>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {lesson.durationMinutes} menit
                          {lesson.videoUrl ? ` · ${lesson.videoUrl}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={saving || li === 0}
                          onClick={() => moveLesson(mod.id!, li, -1)}
                          aria-label="Naikkan lesson"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={saving || li === mod.lessons.length - 1}
                          onClick={() => moveLesson(mod.id!, li, 1)}
                          aria-label="Turunkan lesson"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEditLesson(mod.id!, lesson)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setDeleteTarget({
                              type: "lesson",
                              moduleId: mod.id!,
                              lessonId: lesson.id!,
                              title: lesson.title,
                            })
                          }
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <FormModal
        open={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        title={editingModule ? "Rename Modul" : "Tambah Modul"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModuleModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveModule} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      >
        <form className="space-y-3" onSubmit={handleSaveModule}>
          <label className="block space-y-1 text-sm">
            <span>Judul Modul</span>
            <input
              required
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
        </form>
      </FormModal>

      <FormModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        title={editingLesson ? "Edit Lesson" : "Tambah Lesson"}
        size="lg"
        description="Isi metadata lesson dan URL video. Upload file lokal opsional lewat endpoint upload."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLessonModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveLesson} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSaveLesson}>
          <label className="block space-y-1 text-sm">
            <span>Judul</span>
            <input
              required
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Deskripsi</span>
            <textarea
              rows={3}
              value={lessonForm.description ?? ""}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              placeholder="Ringkasan materi lesson (opsional)"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>Durasi (menit)</span>
              <input
                required
                type="number"
                min={1}
                value={lessonForm.durationMinutes}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            {editingLesson && (
              <label className="block space-y-1 text-sm">
                <span>Pindah ke Modul</span>
                <select
                  value={lessonForm.moduleId ?? lessonModuleId ?? ""}
                  onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
                >
                  {course.modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="block space-y-1 text-sm">
            <span>Video URL</span>
            <input
              type="url"
              value={lessonForm.videoUrl ?? ""}
              onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              placeholder="https://... atau /uploads/videos/..."
            />
            <span className="text-xs text-muted-foreground">
              Tempel URL CDN/MP4, atau unggah file di bawah untuk mengisi path lokal.
            </span>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Upload video (opsional)</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-2 file:py-1 file:text-primary"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSaving(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const session = getSession();
                  const res = await fetch("/api/admin/uploads/video", {
                    method: "POST",
                    headers: session?.email ? { "x-user-email": session.email } : {},
                    body: formData,
                  });
                  if (!res.ok) throw new Error(await res.text());
                  const data = (await res.json()) as { url: string };
                  setLessonForm((prev) => ({ ...prev, videoUrl: data.url }));
                  toast("Video diunggah. URL terisi otomatis.");
                } catch {
                  toast("Upload gagal. Gunakan URL video manual.", "error");
                } finally {
                  setSaving(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lessonForm.isPreviewGratis ?? false}
              onChange={(e) =>
                setLessonForm({ ...lessonForm, isPreviewGratis: e.target.checked })
              }
            />
            Preview gratis (bisa ditonton tanpa enroll)
          </label>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === "module" ? "Hapus modul?" : "Hapus lesson?"}
        description={
          deleteTarget?.type === "module"
            ? `Modul "${deleteTarget.title}" dan semua lesson di dalamnya akan dihapus.`
            : `Lesson "${deleteTarget?.title}" akan dihapus permanen.`
        }
        loading={saving}
      />
    </div>
  );
}
