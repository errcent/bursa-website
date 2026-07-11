"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchChangeRequests,
  reviewChangeRequest,
  type AdminChangeRequest,
} from "@/lib/admin/api";
import { buildChangeDiff } from "@/lib/mentor/change-requests";

function statusVariant(status: AdminChangeRequest["status"]) {
  if (status === "pending") return "outline" as const;
  if (status === "approved" || status === "edited") return "accent" as const;
  return "destructive" as const;
}

function statusLabel(status: AdminChangeRequest["status"]) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "edited") return "Diedit & disetujui";
  return "Ditolak";
}

function actionLabel(action: AdminChangeRequest["action"]) {
  if (action === "CREATE") return "Buat";
  if (action === "DELETE") return "Hapus";
  return "Perbarui";
}

function targetLabel(target: AdminChangeRequest["targetType"]) {
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
    deletedModuleId: "Modul dihapus",
    deletedLessonId: "Pelajaran dihapus",
    id: "ID",
  };
  return map[key] ?? key;
}

export default function AdminChangeRequestsPage() {
  const { toast } = useAdminToast();
  const [items, setItems] = useState<AdminChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [preview, setPreview] = useState<AdminChangeRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [editJson, setEditJson] = useState("");
  const [useEdit, setUseEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchChangeRequests(filter === "all" ? undefined : filter);
      setItems(res.data);
    } catch {
      toast("Gagal memuat usulan mentor.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openPreview(row: AdminChangeRequest) {
    setPreview(row);
    setAdminNote(row.adminNote ?? "");
    setEditJson(row.proposedData ? JSON.stringify(row.proposedData, null, 2) : "{}");
    setUseEdit(false);
  }

  const previewDiff = useMemo(() => {
    if (!preview) return [];
    return buildChangeDiff(preview.currentSnapshot, preview.proposedData, preview.action);
  }, [preview]);

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
      await reviewChangeRequest(preview.id, {
        decision,
        adminNote: adminNote.trim() || undefined,
        editedData,
      });
      toast(
        decision === "approve"
          ? applyEdit
            ? "Usulan diedit & diterapkan."
            : "Usulan disetujui & diterapkan."
          : "Usulan ditolak."
      );
      setPreview(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal memproses usulan.", "error");
    } finally {
      setProcessing(false);
    }
  }

  const columns: DataTableColumn<AdminChangeRequest>[] = [
    {
      key: "courseTitle",
      header: "Kelas",
      sortable: true,
      render: (row) => row.courseTitle,
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
      key: "targetType",
      header: "Target",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{actionLabel(row.action)}</Badge>
          <Badge variant="outline">{targetLabel(row.targetType)}</Badge>
        </div>
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
      key: "createdAt",
      header: "Diajukan",
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleString("id-ID"),
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
          <h1 className="font-heading text-2xl font-semibold">Usulan Mentor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review CREATE / UPDATE / DELETE kurikulum. Menyetujui akan menerapkan perubahan ke
            data live.
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
          emptyMessage="Tidak ada usulan."
        />
      )}

      <FormModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Review usulan"
        description={
          preview
            ? `${actionLabel(preview.action)} · ${targetLabel(preview.targetType)} · ${preview.courseTitle}`
            : undefined
        }
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
                {preview.action === "DELETE" ? "Setujui hapus" : "Setujui & terapkan"}
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
              <p className="text-muted-foreground">Ringkasan mentor</p>
              <p>{preview.summary}</p>
            </div>

            {preview.action === "DELETE" && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">
                Menyetujui akan menghapus {targetLabel(preview.targetType).toLowerCase()} dari
                kurikulum live.
              </p>
            )}

            <div>
              <p className="mb-2 text-muted-foreground">Perbandingan field</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-border text-xs font-medium text-muted-foreground">
                  <div className="bg-muted px-3 py-2">Field</div>
                  <div className="bg-muted px-3 py-2">Saat diajukan</div>
                  <div className="bg-muted px-3 py-2">Usulan</div>
                </div>
                {previewDiff.length === 0 ? (
                  <p className="px-3 py-3 text-muted-foreground">Tidak ada payload.</p>
                ) : (
                  previewDiff.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-border text-sm"
                    >
                      <div className="bg-muted/60 px-3 py-2 text-muted-foreground">
                        {fieldLabel(row.key)}
                      </div>
                      <div className="break-all bg-muted/60 px-3 py-2">
                        {formatValue(row.before)}
                      </div>
                      <div
                        className={`break-all bg-muted/60 px-3 py-2 ${
                          row.changed ? "font-medium text-amber" : ""
                        }`}
                      >
                        {formatValue(row.after)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-muted-foreground">Snapshot JSON</p>
                <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted p-3 text-xs">
                  {JSON.stringify(preview.currentSnapshot, null, 2) ?? "null"}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-muted-foreground">Usulan JSON</p>
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
                placeholder="Opsional — alasan reject atau catatan approve"
              />
            </label>

            {preview.appliedData != null && (
              <div>
                <p className="mb-1 text-muted-foreground">Data yang diterapkan</p>
                <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted p-3 text-xs">
                  {JSON.stringify(preview.appliedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </div>
  );
}
