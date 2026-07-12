"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListPlus, Pencil, Trash2 } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { ConfirmDialog, FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addPlaylistItems,
  createPlaylist,
  deletePlaylist,
  fetchCourses,
  fetchPlaylist,
  fetchPlaylists,
  removePlaylistItem,
  updatePlaylist,
} from "@/lib/admin/api";
import type { AdminCourse } from "@/lib/admin/types";
import type { PlaylistDetail, PlaylistSummary } from "@/lib/playlist/types";

type PlaylistForm = {
  title: string;
  description: string;
  isPublished: boolean;
};

const emptyForm: PlaylistForm = {
  title: "",
  description: "",
  isPublished: false,
};

export default function AdminPlaylistsPage() {
  const { toast } = useAdminToast();
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistSummary | null>(null);
  const [form, setForm] = useState<PlaylistForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlaylistDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [playlistRes, courseRes] = await Promise.all([fetchPlaylists(), fetchCourses()]);
    setPlaylists(playlistRes.data);
    setCourses(courseRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  async function loadDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetchPlaylist(id);
      setDetail(res.data);
    } catch {
      setDetail(null);
      toast("Gagal memuat detail playlist.", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(playlist: PlaylistSummary) {
    setEditing(playlist);
    setForm({
      title: playlist.title,
      description: playlist.description ?? "",
      isPublished: playlist.isPublished ?? false,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updatePlaylist(editing.id, {
          title: form.title,
          description: form.description.trim() || null,
          isPublished: form.isPublished,
        });
        toast("Playlist diperbarui.");
      } else {
        const res = await createPlaylist({
          title: form.title,
          description: form.description.trim() || undefined,
          isPublished: form.isPublished,
        });
        toast("Playlist dibuat.");
        setActiveId(res.data.id);
        await loadDetail(res.data.id);
      }
      setModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan playlist.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deletePlaylist(deleteId);
      toast("Playlist dihapus.");
      if (activeId === deleteId) {
        setActiveId(null);
        setDetail(null);
      }
      setDeleteId(null);
      await load();
    } catch {
      toast("Gagal menghapus playlist.", "error");
    }
  }

  async function handleAddModule() {
    if (!activeId || !selectedModuleId) return;
    try {
      const res = await addPlaylistItems(activeId, { moduleId: selectedModuleId });
      setDetail(res.data);
      toast("Modul ditambahkan ke playlist.");
      setSelectedModuleId("");
      await load();
    } catch {
      toast("Gagal menambahkan modul.", "error");
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!activeId) return;
    try {
      const res = await removePlaylistItem(activeId, itemId);
      setDetail(res.data);
      toast("Item dihapus.");
      await load();
    } catch {
      toast("Gagal menghapus item.", "error");
    }
  }

  async function openManage(playlist: PlaylistSummary) {
    setActiveId(playlist.id);
    setSelectedCourseId("");
    setSelectedModuleId("");
    await loadDetail(playlist.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Playlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kurasi modul dan pelajaran untuk ditampilkan di katalog.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <ListPlus className="size-4" />
          Buat Playlist
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : playlists.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada playlist.</p>
      ) : (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="surface-card flex flex-col gap-3 rounded-xl border border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{playlist.title}</p>
                  {playlist.isPublished ? (
                    <Badge variant="outline" className="text-[10px]">
                      Publik
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {playlist.itemCount} item · /playlist/{playlist.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void openManage(playlist)}>
                  Kelola modul
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(playlist)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(playlist.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeId ? (
        <div className="surface-card space-y-4 rounded-xl border border-border/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-medium">
              {detail?.title ?? "Kelola item"}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setActiveId(null)}>
              Tutup
            </Button>
          </div>

          {detailLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : detail ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">Kelas</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedModuleId("");
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Pilih kelas…</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">Modul</label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    disabled={!selectedCourse}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">Pilih modul…</option>
                    {selectedCourse?.modules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.title} ({mod.lessons.length} pelajaran)
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  disabled={!selectedModuleId}
                  onClick={() => void handleAddModule()}
                >
                  Tambah modul
                </Button>
              </div>

              {detail.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada item dalam playlist ini.</p>
              ) : (
                <ol className="divide-y divide-border/60 rounded-lg border border-border/60">
                  {detail.items.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          {index + 1}.
                        </span>
                        {item.lessonTitle ?? item.courseTitle ?? "Item"}
                        {item.courseTitle && item.lessonTitle ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {item.courseTitle}
                          </span>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemoveItem(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Playlist" : "Buat Playlist"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="admin-playlist-form" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      >
        <form id="admin-playlist-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Judul</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            Publikasikan di katalog
          </label>
        </form>
      </FormModal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Hapus playlist?"
        description="Playlist dan semua itemnya akan dihapus permanen."
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
