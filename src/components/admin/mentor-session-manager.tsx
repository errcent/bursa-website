"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Calendar, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { ConfirmDialog, FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMentorSlot,
  deleteMentorSlot,
  fetchMentorSlots,
  updateMentor,
  updateMentorSlot,
} from "@/lib/admin/api";
import type { AdminAvailabilitySlot, AvailabilitySlotInput } from "@/lib/admin/types";
import {
  formatSlotDate,
  formatSlotRange,
} from "@/lib/sessions/server";

const emptySlotForm: AvailabilitySlotInput = {
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  notes: "",
};

type Props = {
  mentorId: string;
  mentorName: string;
};

export function MentorSessionManager({ mentorId, mentorName }: Props) {
  const { toast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AdminAvailabilitySlot[]>([]);
  const [availableFor1on1, setAvailableFor1on1] = useState(false);
  const [sessionPrice, setSessionPrice] = useState("");
  const [toggling, setToggling] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AdminAvailabilitySlot | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [form, setForm] = useState<AvailabilitySlotInput>(emptySlotForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMentorSlots(mentorId);
      setSlots(res.data.slots);
      setAvailableFor1on1(res.data.mentor.availableFor1on1);
      setSessionPrice(res.data.mentor.sessionPrice ?? "");
    } catch {
      toast("Gagal memuat jadwal sesi.", "error");
    } finally {
      setLoading(false);
    }
  }, [mentorId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle1on1() {
    const next = !availableFor1on1;
    setToggling(true);
    setAvailableFor1on1(next);
    try {
      await updateMentor(mentorId, { availableFor1on1: next });
      toast(next ? "Sesi 1-on-1 diaktifkan." : "Sesi 1-on-1 dinonaktifkan.");
    } catch {
      setAvailableFor1on1(!next);
      toast("Gagal mengubah status 1-on-1.", "error");
    } finally {
      setToggling(false);
    }
  }

  async function saveSessionPrice() {
    try {
      await updateMentor(mentorId, { sessionPrice: sessionPrice.trim() || undefined });
      toast("Harga sesi diperbarui.");
    } catch {
      toast("Gagal menyimpan harga sesi.", "error");
    }
  }

  function openCreate() {
    setEditingSlot(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm({
      ...emptySlotForm,
      date: tomorrow.toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(slot: AdminAvailabilitySlot) {
    const start = new Date(slot.startAt);
    const end = new Date(slot.endAt);
    setEditingSlot(slot);
    setForm({
      date: start.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
      startTime: start.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      endTime: end.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      notes: slot.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSlot) {
        await updateMentorSlot(mentorId, editingSlot.id, form);
        toast("Slot diperbarui.");
      } else {
        await createMentorSlot(mentorId, form);
        toast("Slot ditambahkan.");
      }
      setModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan slot.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteSlotId) return;
    setSaving(true);
    try {
      await deleteMentorSlot(mentorId, deleteSlotId);
      toast("Slot dihapus.");
      setDeleteSlotId(null);
      await load();
    } catch {
      toast("Gagal menghapus slot.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  const openSlots = slots.filter((s) => !s.isBooked);
  const bookedSlots = slots.filter((s) => s.isBooked);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/mentors"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke daftar mentor
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold">Jadwal Sesi 1-on-1</h1>
          <p className="text-sm text-muted-foreground">{mentorName}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12151d] p-5">
        <h2 className="font-heading text-base font-semibold">Pengaturan Sesi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Centang untuk mengaktifkan fitur &quot;Tanya sesi 1-on-1&quot; di profil mentor.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={availableFor1on1}
              disabled={toggling}
              onChange={toggle1on1}
              className="size-4 rounded border-white/20"
            />
            <span>
              Tersedia untuk sesi 1-on-1
              {toggling && <Loader2 className="ml-2 inline size-3 animate-spin" />}
            </span>
          </label>
          <div className="flex flex-1 flex-col gap-2 sm:max-w-sm">
            <label className="text-xs text-muted-foreground">Harga sesi (tampilan)</label>
            <div className="flex gap-2">
              <input
                value={sessionPrice}
                onChange={(e) => setSessionPrice(e.target.value)}
                placeholder="Rp750.000 / 45 menit"
                className="flex-1 rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2 text-sm"
              />
              <Button size="sm" variant="outline" onClick={saveSessionPrice}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#12151d] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">Slot Tersedia</h2>
            <p className="text-sm text-muted-foreground">
              {openSlots.length} slot terbuka · {bookedSlots.length} sudah dibooking
            </p>
          </div>
          <Button size="sm" onClick={openCreate} disabled={!availableFor1on1}>
            <Plus className="size-4" />
            Tambah Slot
          </Button>
        </div>

        {!availableFor1on1 && (
          <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
            Aktifkan sesi 1-on-1 terlebih dahulu agar pelajar dapat melihat jadwal.
          </p>
        )}

        {slots.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Calendar className="size-8 opacity-40" />
            <p className="text-sm">Belum ada slot jadwal. Tambahkan slot waktu tersedia.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Tanggal</th>
                  <th className="pb-2 pr-4 font-medium">Waktu</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Catatan</th>
                  <th className="pb-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">{formatSlotDate(slot.startAt)}</td>
                    <td className="py-3 pr-4">{formatSlotRange(slot.startAt, slot.endAt)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={slot.isBooked ? "outline" : "accent"}>
                        {slot.isBooked
                          ? `Dibooking${slot.bookedByName ? ` · ${slot.bookedByName}` : ""}`
                          : "Tersedia"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{slot.notes ?? "—"}</td>
                    <td className="py-3">
                      {!slot.isBooked && (
                        <div className="flex gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(slot)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteSlotId(slot.id)}
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlot ? "Edit Slot" : "Tambah Slot"}
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
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="space-y-1 text-sm">
            <span>Tanggal</span>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Waktu mulai (WIB)</span>
              <input
                required
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Waktu selesai (WIB)</span>
              <input
                required
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm">
            <span>Catatan (opsional)</span>
            <input
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Contoh: Zoom, topik diskusi umum"
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteSlotId}
        onClose={() => setDeleteSlotId(null)}
        onConfirm={handleDelete}
        title="Hapus slot?"
        description="Slot yang dihapus tidak akan tampil di jadwal pelajar."
        loading={saving}
      />
    </div>
  );
}
