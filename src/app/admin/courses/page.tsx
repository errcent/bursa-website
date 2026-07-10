"use client";

import { useCallback, useEffect, useState } from "react";
import { Film, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog, FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  fetchMentors,
  updateCourse,
} from "@/lib/admin/api";
import type { AdminCourse, AdminMentor, CourseFormInput } from "@/lib/admin/types";
import type { Instrument, Level } from "@/lib/types";
import { formatRupiah } from "@/lib/mock-data";

const LEVELS: Level[] = ["Pemula", "Menengah", "Mahir"];
const INSTRUMENTS: Instrument[] = ["Saham", "Crypto", "Forex"];

const emptyForm: CourseFormInput = {
  title: "",
  shortDescription: "",
  price: 499000,
  level: "Pemula",
  instrument: "Saham",
  mentorId: "",
  durationHours: 4,
  isPublished: false,
  modules: [{ title: "Modul 1", lessons: [{ title: "Pengenalan", durationMinutes: 15 }] }],
};

export default function AdminCoursesPage() {
  const { toast } = useAdminToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [form, setForm] = useState<CourseFormInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [courseRes, mentorRes] = await Promise.all([fetchCourses(), fetchMentors()]);
    setCourses(courseRes.data);
    setMentors(mentorRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      mentorId: mentors[0]?.id ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(course: AdminCourse) {
    setEditing(course);
    setForm({
      title: course.title,
      shortDescription: course.shortDescription,
      price: course.price,
      level: course.level,
      instrument: course.instrument,
      mentorId: course.mentorId,
      durationHours: course.durationHours,
      isPublished: course.isPublished,
      modules: course.modules,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { modules: _modules, ...courseFields } = form;
        await updateCourse(editing.id, courseFields);
        toast("Kelas berhasil diperbarui.");
      } else {
        await createCourse(form);
        toast("Kelas berhasil dibuat.");
      }
      setModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan kelas.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(course: AdminCourse) {
    try {
      await updateCourse(course.id, { isPublished: !course.isPublished });
      toast(course.isPublished ? "Kelas tidak dipublikasikan." : "Kelas dipublikasikan.");
      await load();
    } catch {
      toast("Gagal mengubah status publikasi.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteCourse(deleteId);
      toast("Kelas dihapus.");
      setDeleteId(null);
      await load();
    } catch {
      toast("Gagal menghapus kelas.", "error");
    } finally {
      setSaving(false);
    }
  }

  function updateModule(index: number, title: string) {
    const modules = [...form.modules];
    modules[index] = { ...modules[index], title };
    setForm({ ...form, modules });
  }

  function updateLesson(modIndex: number, lessonIndex: number, field: "title" | "durationMinutes", value: string) {
    const modules = [...form.modules];
    const lessons = [...modules[modIndex].lessons];
    lessons[lessonIndex] = {
      ...lessons[lessonIndex],
      [field]: field === "durationMinutes" ? Number(value) : value,
    };
    modules[modIndex] = { ...modules[modIndex], lessons };
    setForm({ ...form, modules });
  }

  const columns: DataTableColumn<AdminCourse>[] = [
    {
      key: "title",
      header: "Judul",
      sortable: true,
      render: (row) => (
        <div className="max-w-xs">
          <p className="line-clamp-2 font-medium">{row.title}</p>
        </div>
      ),
    },
    { key: "mentorName", header: "Mentor", sortable: true, render: (row) => row.mentorName },
    {
      key: "price",
      header: "Harga",
      sortable: true,
      render: (row) => formatRupiah(row.price),
    },
    {
      key: "isPublished",
      header: "Status",
      render: (row) => (
        <Badge variant={row.isPublished ? "accent" : "outline"}>
          {row.isPublished ? "Publik" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "studentsCount",
      header: "Siswa",
      sortable: true,
      render: (row) => row.studentsCount.toLocaleString("id-ID"),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={() => togglePublish(row)}>
            {row.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            render={<Link href={`/admin/courses/${row.id}/curriculum`} />}
            aria-label="Kelola kurikulum"
          >
            <Film className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setDeleteId(row.id)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Manajemen Kelas</h1>
        <p className="text-sm text-muted-foreground">Kelola katalog kelas, modul, dan status publikasi.</p>
      </div>

      <DataTable
        data={courses}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["title", "mentorName"]}
        searchPlaceholder="Cari kelas..."
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Kelas
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Kelas" : "Tambah Kelas"}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span>Judul Kelas</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span>Deskripsi Singkat</span>
              <textarea
                required
                rows={2}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Mentor</span>
              <select
                required
                value={form.mentorId}
                onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Harga (IDR)</span>
              <input
                required
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Level</span>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as Level })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Instrumen</span>
              <select
                value={form.instrument}
                onChange={(e) => setForm({ ...form, instrument: e.target.value as Instrument })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Durasi (jam)</span>
              <input
                type="number"
                min={1}
                value={form.durationHours}
                onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Publikasikan segera
            </label>
          </div>

          {editing ? (
            <div className="rounded-lg border border-white/8 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-sm font-medium">Kurikulum</h3>
                  <p className="text-xs text-muted-foreground">
                    {form.modules.length} modul ·{" "}
                    {form.modules.reduce((s, m) => s + m.lessons.length, 0)} lesson. Kelola video,
                    deskripsi, preview, dan urutan di halaman kurikulum.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  render={<Link href={`/admin/courses/${editing.id}/curriculum`} />}
                >
                  <Film className="size-4" />
                  Kelola Kurikulum
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/8 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading text-sm font-medium">Modul & Lesson awal</h3>
                  <p className="text-xs text-muted-foreground">
                    Struktur awal saat membuat kelas. Detail video bisa dilengkapi setelahnya.
                  </p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setForm({
                      ...form,
                      modules: [
                        ...form.modules,
                        {
                          title: `Modul ${form.modules.length + 1}`,
                          lessons: [{ title: "Lesson baru", durationMinutes: 10 }],
                        },
                      ],
                    })
                  }
                >
                  <Plus className="size-3" />
                  Modul
                </Button>
              </div>
              <div className="space-y-4">
                {form.modules.map((mod, mi) => (
                  <div key={mi} className="rounded-lg bg-[#0f1117] p-3">
                    <div className="mb-2 flex gap-2">
                      <input
                        value={mod.title}
                        onChange={(e) => updateModule(mi, e.target.value)}
                        className="w-full rounded border border-white/10 bg-transparent px-2 py-1 text-sm font-medium"
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            ...form,
                            modules: form.modules.filter((_, i) => i !== mi),
                          })
                        }
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                    {mod.lessons.map((lesson, li) => (
                      <div key={li} className="mb-2 flex gap-2">
                        <input
                          value={lesson.title}
                          onChange={(e) => updateLesson(mi, li, "title", e.target.value)}
                          className="min-w-0 flex-1 rounded border border-white/10 bg-transparent px-2 py-1 text-sm"
                          placeholder="Judul lesson"
                        />
                        <input
                          type="number"
                          min={1}
                          value={lesson.durationMinutes}
                          onChange={(e) => updateLesson(mi, li, "durationMinutes", e.target.value)}
                          className="w-24 rounded border border-white/10 bg-transparent px-2 py-1 text-sm"
                          placeholder="Menit"
                        />
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            const modules = [...form.modules];
                            modules[mi] = {
                              ...modules[mi],
                              lessons: modules[mi].lessons.filter((_, i) => i !== li),
                            };
                            setForm({ ...form, modules });
                          }}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        const modules = [...form.modules];
                        modules[mi] = {
                          ...modules[mi],
                          lessons: [
                            ...modules[mi].lessons,
                            { title: "Lesson baru", durationMinutes: 10 },
                          ],
                        };
                        setForm({ ...form, modules });
                      }}
                    >
                      <Plus className="size-3" />
                      Lesson
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus kelas?"
        description="Semua modul, lesson, dan data terkait akan dihapus."
        loading={saving}
      />
    </div>
  );
}
