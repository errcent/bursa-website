"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Lock, MessageSquare, Plus, Users } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { StaffChatPanel } from "@/components/mentor/staff-chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createChatRoom,
  fetchChatRoomMembers,
  fetchChatRooms,
  fetchCollaborationChat,
  fetchMentors,
  updateChatRoom,
  type AdminCollaborationChatRoom,
} from "@/lib/admin/api";
import type {
  AdminChatRoom,
  AdminChatRoomMember,
  AdminMentor,
  ChatRoomFormInput,
  ChatRoomTierLabel,
} from "@/lib/admin/types";

const TIERS: ChatRoomTierLabel[] = ["Pemula", "Menengah", "Mahir"];

const emptyForm: ChatRoomFormInput = {
  name: "",
  mentorId: "",
  tier: "Pemula",
  roomKind: "mentor_community",
  screenshotProtection: false,
  isProtected: false,
  description: "",
};

export default function AdminChatRoomsPage() {
  const { toast } = useAdminToast();
  const [rooms, setRooms] = useState<AdminChatRoom[]>([]);
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<AdminChatRoomMember[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<AdminChatRoom | null>(null);
  const [form, setForm] = useState<ChatRoomFormInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [collabRooms, setCollabRooms] = useState<AdminCollaborationChatRoom[]>([]);
  const [collabCurrentUserId, setCollabCurrentUserId] = useState<string | null>(null);
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [collabError, setCollabError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setCollabError(null);
    const [roomRes, mentorRes, collabOutcome] = await Promise.all([
      fetchChatRooms(),
      fetchMentors(),
      fetchCollaborationChat()
        .then((res) => ({ ok: true as const, data: res.data }))
        .catch((e: unknown) => ({
          ok: false as const,
          error: e instanceof Error ? e.message : "Gagal memuat ruang kolaborasi.",
        })),
    ]);
    setRooms(roomRes.data);
    setMentors(mentorRes.data);
    if (collabOutcome.ok) {
      setCollabRooms(collabOutcome.data.rooms);
      setCollabCurrentUserId(collabOutcome.data.currentUserId);
      setSelectedCollabId((prev) => {
        if (prev && collabOutcome.data.rooms.some((r) => r.id === prev)) return prev;
        return collabOutcome.data.rooms[0]?.id ?? null;
      });
    } else {
      setCollabRooms([]);
      setCollabCurrentUserId(null);
      setSelectedCollabId(null);
      setCollabError(collabOutcome.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({ ...emptyForm, mentorId: mentors[0]?.id ?? "" });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createChatRoom(form);
      toast("Chat room berhasil dibuat.");
      setModalOpen(false);
      await load();
    } catch {
      toast("Gagal membuat chat room.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(room: AdminChatRoom) {
    try {
      await updateChatRoom(room.id, { isActive: !room.isActive });
      toast(room.isActive ? "Chat room dinonaktifkan." : "Chat room diaktifkan.");
      await load();
    } catch {
      toast("Gagal mengubah status room.", "error");
    }
  }

  async function viewMembers(room: AdminChatRoom) {
    setSelectedRoom(room);
    const res = await fetchChatRoomMembers(room.id);
    setMembers(res.data);
    setMembersOpen(true);
  }

  const columns: DataTableColumn<AdminChatRoom>[] = [
    {
      key: "name",
      header: "Nama",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    { key: "mentorName", header: "Mentor", sortable: true, render: (row) => row.mentorName },
    {
      key: "roomKind",
      header: "Jenis",
      render: (row) => (
        <Badge variant="outline">
          {row.roomKind === "public"
            ? "Publik"
            : row.roomKind === "mentor_internal"
              ? "Kolaborasi staf"
              : "Hub mentor"}
        </Badge>
      ),
    },
    { key: "tier", header: "Tier", sortable: true, render: (row) => row.tier },
    {
      key: "protection",
      header: "Proteksi",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.isProtected && <Badge variant="outline">Protected</Badge>}
          {row.screenshotProtection && <Badge variant="accent">Screenshot</Badge>}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <Badge variant={row.isActive ? "accent" : "outline"}>
          {row.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={() => toggleActive(row)}>
            {row.isActive ? "Nonaktifkan" : "Aktifkan"}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => viewMembers(row)}>
            <Eye className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Manajemen Chat Room</h1>
        <p className="text-sm text-muted-foreground">
          Satu hub per mentor; publik/privat diatur di cabang. Ruang publik platform terpisah.
        </p>
      </div>

      {collabError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {collabError}
        </p>
      )}

      {collabRooms.length > 0 && (
        <div className="space-y-3 rounded-xl border border-white/8 bg-[#161a24] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold">Kolaborasi per mentor</h2>
            <Badge variant="outline">Internal</Badge>
            <Badge variant="outline" className="gap-1">
              <Lock className="size-3" />
              Privat
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Satu thread privat per mentor dengan admin — mentor tidak digabung dalam satu grup.
          </p>
          <div className="flex flex-col gap-3 lg:flex-row">
            <ul className="max-h-[420px] w-full shrink-0 space-y-1 overflow-y-auto lg:w-64">
              {collabRooms.map((room) => {
                const selected = room.id === selectedCollabId;
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCollabId(room.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        selected
                          ? "border-primary/40 bg-primary/10"
                          : "border-white/8 bg-black/20 hover:border-white/15"
                      }`}
                    >
                      <p className="truncate text-sm font-medium">{room.mentorName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="size-3" />
                        {room.memberCount} anggota
                        {room.lastMessage
                          ? ` · ${room.lastMessage.authorName}: ${room.lastMessage.content.slice(0, 40)}`
                          : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="min-w-0 flex-1">
              {(() => {
                const active = collabRooms.find((r) => r.id === selectedCollabId);
                if (!active || !collabCurrentUserId) {
                  return (
                    <p className="text-sm text-muted-foreground">Pilih thread mentor untuk membuka chat.</p>
                  );
                }
                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-sm font-semibold">{active.name}</h3>
                      <Badge variant="outline">{active.mentorName}</Badge>
                    </div>
                    <StaffChatPanel
                      key={active.id}
                      roomId={active.id}
                      currentUserId={collabCurrentUserId}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={rooms}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["name", "mentorName", "tier"]}
        searchPlaceholder="Cari chat room..."
        toolbar={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Buat Chat Room
          </Button>
        }
      />

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat Chat Room"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan..." : "Buat"}
            </Button>
          </div>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Nama</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Jenis ruang</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={form.roomKind ?? "mentor_community"}
              onChange={(e) => {
                const roomKind = e.target.value as ChatRoomFormInput["roomKind"];
                setForm((f) => ({
                  ...f,
                  roomKind,
                  tier: f.tier === "Internal" ? "Pemula" : f.tier,
                  mentorId: roomKind === "public" ? "" : f.mentorId || mentors[0]?.id || "",
                }));
              }}
            >
              <option value="public">Publik platform (semua anggota)</option>
              <option value="mentor_community">Hub mentor (1 per mentor)</option>
            </select>
          </label>
          {form.roomKind !== "public" && (
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Mentor</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                value={form.mentorId}
                onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))}
                required
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Tier</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={form.tier}
              onChange={(e) =>
                setForm((f) => ({ ...f, tier: e.target.value as ChatRoomTierLabel }))
              }
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Deskripsi</span>
            <textarea
              className="min-h-20 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isProtected}
              onChange={(e) => setForm((f) => ({ ...f, isProtected: e.target.checked }))}
            />
            Protected
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.screenshotProtection}
              onChange={(e) =>
                setForm((f) => ({ ...f, screenshotProtection: e.target.checked }))
              }
            />
            Screenshot protection
          </label>
        </form>
      </FormModal>

      <FormModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title={selectedRoom ? `Anggota — ${selectedRoom.name}` : "Anggota"}
      >
        <ul className="space-y-2 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex justify-between border-b border-white/5 py-2">
              <span>
                {m.name}{" "}
                <span className="text-xs text-muted-foreground">({m.email})</span>
              </span>
              <Badge variant="outline">{m.role}</Badge>
            </li>
          ))}
        </ul>
      </FormModal>
    </div>
  );
}
