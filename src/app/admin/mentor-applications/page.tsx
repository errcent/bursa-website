"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createDirectMentorInvite, fetchMentorApplications } from "@/lib/admin/api";
import type { MentorApplicationRecord } from "@/lib/mentor-program/types";

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "SCREENING", label: "Screening" },
  { value: "L2_INVITED", label: "L2 diundang" },
  { value: "L2_IN_PROGRESS", label: "L2 draf" },
  { value: "REVIEW", label: "Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "TALENT_POOL", label: "Talent pool" },
] as const;

export default function AdminMentorApplicationsPage() {
  const { toast } = useAdminToast();
  const [items, setItems] = useState<MentorApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchMentorApplications(filter || undefined);
      setItems(result.data);
    } catch {
      toast("Gagal memuat aplikasi mentor.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitInvite() {
    setSaving(true);
    try {
      const result = await createDirectMentorInvite({
        fullName: inviteName,
        email: inviteEmail,
        note: inviteNote || undefined,
      });
      setInviteUrl(result.data.l2Url);
      toast("Undangan L2 dibuat.");
      await load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Gagal membuat undangan.", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<MentorApplicationRecord>[] = [
    {
      key: "fullName",
      header: "Kandidat",
      sortable: true,
      render: (row) => (
        <div>
          <Link href={`/admin/mentor-applications/${row.id}`} className="font-medium hover:underline">
            {row.fullName}
          </Link>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: "track",
      header: "Jalur",
      render: (row) => <span className="text-xs">{row.track}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge variant="outline">{row.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Masuk",
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleString("id-ID"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Aplikasi mentor</h1>
          <p className="text-sm text-muted-foreground">Antrian L1 screening dan L2 review.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Undang L2 langsung</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value || "all"}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <DataTable columns={columns} data={items} getRowId={(row) => row.id} />
      )}

      <FormModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteUrl(null);
        }}
        title="Undang L2 langsung"
        description="Bypass tahap 1. Quality gate tetap berlaku."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Tutup
            </Button>
            <Button disabled={saving} onClick={() => void submitInvite()}>
              Buat tautan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="text-sm">
            Nama
            <input
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Catatan internal
            <textarea
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={inviteNote}
              onChange={(event) => setInviteNote(event.target.value)}
            />
          </label>
          {inviteUrl ? (
            <div className="flex flex-col gap-2">
              <p className="break-all text-xs">Tautan L2 (salin sekarang): {inviteUrl}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl);
                  toast("Tautan L2 disalin.");
                }}
              >
                Salin tautan L2
              </Button>
            </div>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
