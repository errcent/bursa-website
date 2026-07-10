"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Calendar, Pencil, Plus, Trash2 } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { ConfirmDialog, FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createMentor,
  deleteMentor,
  fetchMentors,
  updateMentor,
} from "@/lib/admin/api";
import type { AdminMentor, MentorFormInput } from "@/lib/admin/types";
import type { Instrument } from "@/lib/types";

const INSTRUMENTS: Instrument[] = ["Saham", "Crypto", "Forex"];

const emptyForm: MentorFormInput = {
  name: "",
  email: "",
  title: "",
  bio: "",
  philosophy: "",
  instruments: ["Saham"],
  yearsExperience: 1,
  verified: true,
  availableFor1on1: false,
};

export default function AdminMentorsPage() {
  const { toast } = useAdminToast();
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminMentor | null>(null);
  const [form, setForm] = useState<MentorFormInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchMentors();
    setMentors(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(mentor: AdminMentor) {
    setEditing(mentor);
    setForm({
      name: mentor.name,
      email: mentor.email,
      title: mentor.title,
      bio: mentor.bio,
      philosophy: mentor.philosophy,
      instruments: mentor.instruments,
      yearsExperience: mentor.yearsExperience,
      licenseLabel: mentor.licenseLabel,
      verified: mentor.verified,
      availableFor1on1: mentor.availableFor1on1,
      sessionPrice: mentor.sessionPrice,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateMentor(editing.id, form);
        toast("Mentor berhasil diperbarui.");
      } else {
        await createMentor(form);
        toast("Mentor berhasil ditambahkan.");
      }
      setModalOpen(false);
      await load();
    } catch {
      toast("Gagal menyimpan mentor.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVerified(mentor: AdminMentor) {
    const nextVerified = !mentor.verified;
    setVerifyingId(mentor.id);
    setMentors((prev) =>
      prev.map((m) => (m.id === mentor.id ? { ...m, verified: nextVerified } : m))
    );

    try {
      const { data } = await updateMentor(mentor.id, { verified: nextVerified });
      setMentors((prev) => prev.map((m) => (m.id === mentor.id ? data : m)));
      toast(nextVerified ? "Mentor diverifikasi." : "Verifikasi dicabut.");
    } catch {
      setMentors((prev) =>
        prev.map((m) => (m.id === mentor.id ? { ...m, verified: mentor.verified } : m))
      );
      toast("Gagal mengubah status verifikasi.", "error");
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteMentor(deleteId);
      toast("Mentor dihapus.");
      setDeleteId(null);
      await load();
    } catch {
      toast("Gagal menghapus mentor.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<AdminMentor>[] = [
    {
      key: "name",
      header: "Nama",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "title", header: "Spesialisasi", sortable: true, render: (row) => row.title },
    {
      key: "instruments",
      header: "Instrumen",
      render: (row) => row.instruments.join(", "),
    },
    {
      key: "verified",
      header: "Verifikasi",
      render: (row) => (
        <Badge variant={row.verified ? "accent" : "outline"}>
          {row.verified ? "Terverifikasi" : "Menunggu"}
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
          <Button size="xs" variant="outline" render={<Link href={`/admin/mentors/${row.id}/sesi`} />}>
            <Calendar className="size-3" />
            Jadwal
          </Button>
          <Button
            size="xs"
            variant="outline"
            disabled={verifyingId === row.id}
            onClick={() => toggleVerified(row)}
          >
            {verifyingId === row.id ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Memproses...
              </>
            ) : row.verified ? (
              "Cabut"
            ) : (
              "Verifikasi"
            )}
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
        <h1 className="font-heading text-2xl font-semibold">Manajemen Mentor</h1>
        <p className="text-sm text-muted-foreground">Kelola profil, verifikasi, dan data mentor.</p>
      </div>

      <DataTable
        data={mentors}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["name", "email", "title"]}
        searchPlaceholder="Cari mentor..."
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Mentor
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Mentor" : "Tambah Mentor"}
        size="lg"
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
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Nama</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Pengalaman (tahun)</span>
            <input
              required
              type="number"
              min={1}
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Judul / Spesialisasi</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Bio</span>
            <textarea
              required
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Filosofi</span>
            <textarea
              rows={2}
              value={form.philosophy}
              onChange={(e) => setForm({ ...form, philosophy: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
            />
          </label>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm">Instrumen</legend>
            <div className="flex flex-wrap gap-3">
              {INSTRUMENTS.map((inst) => (
                <label key={inst} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.instruments.includes(inst)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.instruments, inst]
                        : form.instruments.filter((i) => i !== inst);
                      setForm({ ...form, instruments: next });
                    }}
                  />
                  {inst}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => setForm({ ...form, verified: e.target.checked })}
            />
            Terverifikasi
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.availableFor1on1}
              onChange={(e) => setForm({ ...form, availableFor1on1: e.target.checked })}
            />
            Tersedia 1-on-1
          </label>
          {form.availableFor1on1 && (
            <label className="space-y-1 text-sm sm:col-span-2">
              <span>Harga sesi (tampilan)</span>
              <input
                value={form.sessionPrice ?? ""}
                onChange={(e) => setForm({ ...form, sessionPrice: e.target.value })}
                placeholder="Rp750.000 / 45 menit"
                className="w-full rounded-lg border border-white/10 bg-[#0f1117] px-3 py-2"
              />
            </label>
          )}
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus mentor?"
        description="Profil mentor dan relasi terkait akan dihapus dari database."
        loading={saving}
      />
    </div>
  );
}
