"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GitBranch, Lock, MessageSquare, Users } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { StaffChatPanel } from "@/components/mentor/staff-chat-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canMutateMentor } from "@/lib/auth/roles";
import { branchModeLabel } from "@/lib/chat/room-kinds";
import type { ChatRoom } from "@/lib/chat/types";
import {
  createMentorBranchChangeRequest,
  fetchMentorBranchChangeRequests,
  fetchMentorChatRooms,
  fetchMentorCollaborationChat,
  type ChatBranchChangeRequestDto,
  type MentorAdminChatSummary,
} from "@/lib/mentor/api";

export default function MentorChatPage() {
  const { session } = useAuth();
  const readOnly = !canMutateMentor(session?.role);
  const [collab, setCollab] = useState<MentorAdminChatSummary | null>(null);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [loadingCollab, setLoadingCollab] = useState(true);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [branchRequests, setBranchRequests] = useState<ChatBranchChangeRequestDto[]>([]);
  const [proposalRoomId, setProposalRoomId] = useState("");
  const [proposalName, setProposalName] = useState("");
  const [proposalMode, setProposalMode] = useState<"one_way" | "two_way">("two_way");
  const [proposalVisibility, setProposalVisibility] = useState<"public" | "private">("public");
  const [proposalSummary, setProposalSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const loadCollab = useCallback(async () => {
    setLoadingCollab(true);
    setCollabError(null);
    try {
      const room = await fetchMentorCollaborationChat();
      setCollab(room);
    } catch (e) {
      setCollabError(e instanceof Error ? e.message : "Gagal memuat ruang kolaborasi.");
    } finally {
      setLoadingCollab(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    setRoomsError(null);
    try {
      const [r, br] = await Promise.all([
        fetchMentorChatRooms(),
        fetchMentorBranchChangeRequests(),
      ]);
      setRooms(r);
      setBranchRequests(br);
      setProposalRoomId((prev) => prev || r[0]?.id || "");
    } catch (e) {
      setRoomsError(e instanceof Error ? e.message : "Gagal memuat ruang chat.");
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    loadCollab();
    loadRooms();
  }, [loadCollab, loadRooms]);

  async function submitBranchProposal() {
    if (readOnly) return;
    setSaving(true);
    setFormMsg(null);
    try {
      await createMentorBranchChangeRequest({
        roomId: proposalRoomId,
        action: "CREATE",
        summary: proposalSummary.trim() || `Usulan cabang baru: ${proposalName}`,
        proposedData: {
          name: proposalName.trim(),
          mode: proposalMode,
          visibility: proposalVisibility,
          senderPolicy:
            proposalVisibility === "private" ? "mentor_and_moderators" : "mentor_only",
        },
      });
      setProposalName("");
      setProposalSummary("");
      setProposalVisibility("public");
      setFormMsg("Usulan cabang dikirim. Menunggu persetujuan admin.");
      await loadRooms();
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "Gagal mengirim usulan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Group Chat Domain</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu hub per mentor. Publik/privat diatur di cabang; cabang baru perlu persetujuan admin.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Chat privat dengan Admin
        </h2>
        {loadingCollab ? (
          <Skeleton className="h-28 w-full" />
        ) : collabError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {collabError}
          </p>
        ) : collab ? (
          <div className="space-y-3">
            <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <h3 className="font-heading text-sm font-semibold">{collab.name}</h3>
                  <Badge variant="outline">{collab.tier}</Badge>
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  >
                    <Lock className="size-3" />
                    Privat
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {collab.description ??
                    "Thread privat Anda dengan admin — mentor lain tidak melihat percakapan ini."}
                </p>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="size-3" />
                  {collab.memberCount} anggota
                  {collab.lastMessage
                    ? ` · ${collab.lastMessage.authorName}: ${collab.lastMessage.content.slice(0, 60)}`
                    : ""}
                </p>
              </div>
            </div>
            {readOnly || !collab.currentUserId ? (
              <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                Mode QC — chat privat mentor–admin terkunci untuk developer.
              </p>
            ) : (
              <StaffChatPanel roomId={collab.id} currentUserId={collab.currentUserId} />
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Hub mentor (milik Anda atau akses moderator)
        </h2>
        {loadingRooms ? (
          <Skeleton className="h-24 w-full" />
        ) : roomsError ? (
          <p className="text-sm text-destructive">{roomsError}</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada hub. Admin dapat membuat 1 grup mentor untuk Anda.
          </p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => {
              const hasPrivateBranch = room.branches?.some((b) => b.visibility === "private");
              return (
                <li
                  key={room.id}
                  className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-sm font-semibold">{room.name}</h2>
                      <Badge variant="outline">Hub mentor</Badge>
                      {hasPrivateBranch && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                          <Lock className="size-3" />
                          Ada cabang privat
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {room.description}
                    </p>
                    {room.branches && room.branches.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {room.branches.map((b) => (
                          <Badge key={b.id} variant="outline" className="gap-1 text-[10px]">
                            <GitBranch className="size-2.5" />
                            {b.name} · {branchModeLabel(b.mode)}
                            {b.visibility === "private" ? " · Privat" : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {readOnly && hasPrivateBranch ? (
                      <Button size="sm" variant="outline" disabled>
                        <Lock className="size-3.5" />
                        QC — cabang privat terkunci
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      render={
                        <Link
                          href={
                            room.mentorId
                              ? `/komunitas/${room.slug}?mentorId=${encodeURIComponent(room.mentorId)}`
                              : `/komunitas/${room.slug}`
                          }
                        />
                      }
                    >
                      Buka ruang
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {!readOnly && rooms.length > 0 && (
        <section className="surface-card space-y-3 p-4">
          <h2 className="font-heading text-sm font-semibold">Usulan cabang baru</h2>
          <p className="text-xs text-muted-foreground">
            Menambah/mengubah struktur cabang memerlukan persetujuan admin (mirip usulan konten).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Ruang</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={proposalRoomId}
                onChange={(e) => setProposalRoomId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Mode</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={proposalMode}
                onChange={(e) => setProposalMode(e.target.value as "one_way" | "two_way")}
              >
                <option value="two_way">2 arah (anggota bisa kirim)</option>
                <option value="one_way">1 arah (hanya mentor)</option>
              </select>
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Visibilitas</span>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={proposalVisibility}
                onChange={(e) =>
                  setProposalVisibility(e.target.value as "public" | "private")
                }
              >
                <option value="public">Publik (anggota hub)</option>
                <option value="private">Privat (mentor & moderator)</option>
              </select>
            </label>
            <label className="space-y-1 text-xs sm:col-span-2">
              <span className="text-muted-foreground">Nama cabang</span>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={proposalName}
                onChange={(e) => setProposalName(e.target.value)}
                placeholder="Contoh: Q&A Mingguan"
              />
            </label>
            <label className="space-y-1 text-xs sm:col-span-2">
              <span className="text-muted-foreground">Ringkasan usulan</span>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={proposalSummary}
                onChange={(e) => setProposalSummary(e.target.value)}
                placeholder="Alasan menambah cabang..."
              />
            </label>
          </div>
          {formMsg && <p className="text-xs text-muted-foreground">{formMsg}</p>}
          <Button
            size="sm"
            disabled={saving || !proposalName.trim()}
            onClick={submitBranchProposal}
          >
            {saving ? "Mengirim..." : "Kirim usulan ke admin"}
          </Button>
        </section>
      )}

      {branchRequests.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Riwayat usulan cabang
          </h2>
          <ul className="space-y-2">
            {branchRequests.slice(0, 8).map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs"
              >
                <span>
                  {req.summary} · {req.roomName}
                </span>
                <Badge variant="outline">
                  {req.status === "pending"
                    ? "Menunggu"
                    : req.status === "approved" || req.status === "edited"
                      ? "Disetujui"
                      : "Ditolak"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
