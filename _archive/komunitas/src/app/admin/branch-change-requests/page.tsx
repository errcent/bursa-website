"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchBranchChangeRequests,
  reviewBranchChangeRequest,
  type AdminBranchChangeRequest,
} from "@/lib/admin/api";

function statusVariant(status: AdminBranchChangeRequest["status"]) {
  if (status === "pending") return "outline" as const;
  if (status === "approved" || status === "edited") return "accent" as const;
  return "destructive" as const;
}

function statusLabel(status: AdminBranchChangeRequest["status"]) {
  if (status === "pending") return "Menunggu";
  if (status === "approved" || status === "edited") return "Disetujui";
  return "Ditolak";
}

export default function AdminBranchChangeRequestsPage() {
  const { toast } = useAdminToast();
  const [items, setItems] = useState<AdminBranchChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [preview, setPreview] = useState<AdminBranchChangeRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [editJson, setEditJson] = useState("");
  const [useEdit, setUseEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBranchChangeRequests(filter === "all" ? undefined : filter);
      setItems(res.data);
    } catch {
      toast("Gagal memuat usulan cabang.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openPreview(row: AdminBranchChangeRequest) {
    setPreview(row);
    setAdminNote(row.adminNote ?? "");
    setEditJson(row.proposedData ? JSON.stringify(row.proposedData, null, 2) : "{}");
    setUseEdit(false);
  }

  async function handleResolve(
    decision: "approve" | "reject",
    options?: { withEdit?: boolean }
  ) {
    if (!preview) return;
    const applyEdit = Boolean(options?.withEdit ?? useEdit);
    setProcessing(true);
    try {
      let editedData: Record<string, unknown> | undefined;
      if (decision === "approve" && applyEdit) {
        editedData = JSON.parse(editJson) as Record<string, unknown>;
      }
      await reviewBranchChangeRequest(preview.id, {
        decision,
        adminNote: adminNote.trim() || undefined,
        editedData,
      });
      toast(
        decision === "approve"
          ? applyEdit
            ? "Usulan cabang diedit & diterapkan."
            : "Usulan cabang disetujui."
          : "Usulan cabang ditolak."
      );
      setPreview(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal memproses usulan.", "error");
    } finally {
      setProcessing(false);
    }
  }

  const columns: DataTableColumn<AdminBranchChangeRequest>[] = [
    {
      key: "roomName",
      header: "Ruang",
      render: (row) => row.roomName,
    },
    {
      key: "mentorName",
      header: "Mentor",
      render: (row) => (
        <div>
          <p className="text-sm">{row.mentorName}</p>
          <p className="text-xs text-muted-foreground">{row.mentorEmail}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      render: (row) => (
        <Badge variant="outline">
          {row.action === "CREATE" ? "Tambah" : row.action === "UPDATE" ? "Ubah" : "Hapus"} cabang
        </Badge>
      ),
    },
    {
      key: "summary",
      header: "Ringkasan",
      render: (row) => <p className="line-clamp-2 max-w-xs text-sm">{row.summary}</p>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
      ),
    },
    {
      key: "id",
      header: "",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => openPreview(row)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Usulan Cabang Chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve / reject / edit usulan struktur cabang (1 arah / 2 arah) dari mentor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? "Semua"
                : f === "pending"
                  ? "Menunggu"
                  : f === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          getRowId={(row) => row.id}
          emptyMessage="Tidak ada usulan cabang."
        />
      )}

      <FormModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Review usulan cabang"
        description={preview ? `${preview.roomName} · ${preview.action}` : undefined}
        size="lg"
        footer={
          preview?.status === "pending" ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={processing}
                onClick={() => handleResolve("reject")}
              >
                <X className="size-4" />
                Tolak
              </Button>
              {preview.action !== "DELETE" && (
                <Button
                  variant="outline"
                  disabled={processing}
                  onClick={() => {
                    setUseEdit(true);
                    handleResolve("approve", { withEdit: true });
                  }}
                >
                  <Pencil className="size-4" />
                  Edit & setujui
                </Button>
              )}
              <Button
                disabled={processing}
                onClick={() => handleResolve("approve", { withEdit: false })}
              >
                <Check className="size-4" />
                Setujui & terapkan
              </Button>
            </div>
          ) : undefined
        }
      >
        {preview && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Mentor</p>
              <p>
                {preview.mentorName} · {preview.mentorEmail}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ringkasan</p>
              <p>{preview.summary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-muted-foreground">Snapshot</p>
                <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted p-3 text-xs">
                  {JSON.stringify(preview.currentSnapshot, null, 2) ?? "null"}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">Usulan</p>
                <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted p-3 text-xs">
                  {JSON.stringify(preview.proposedData, null, 2) ?? "null"}
                </pre>
              </div>
            </div>
            {preview.status === "pending" && preview.action !== "DELETE" && (
              <div>
                <label className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={useEdit}
                    onChange={(e) => setUseEdit(e.target.checked)}
                  />
                  Edit payload sebelum menerapkan
                </label>
                {useEdit && (
                  <textarea
                    className="mt-2 min-h-40 w-full rounded-lg border border-border bg-muted p-3 font-mono text-xs"
                    value={editJson}
                    onChange={(e) => setEditJson(e.target.value)}
                  />
                )}
              </div>
            )}
            <label className="block">
              <span className="mb-1 block text-muted-foreground">Catatan admin</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-border bg-muted px-3 py-2"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                disabled={preview.status !== "pending"}
              />
            </label>
          </div>
        )}
      </FormModal>
    </div>
  );
}
