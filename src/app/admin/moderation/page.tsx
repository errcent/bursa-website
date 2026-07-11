"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchModerationQueue, resolveModeration } from "@/lib/admin/api";
import type { AdminModerationItem } from "@/lib/admin/types";

function statusVariant(status: AdminModerationItem["status"]) {
  if (status === "pending") return "outline" as const;
  if (status === "approved") return "accent" as const;
  return "destructive" as const;
}

function statusLabel(status: AdminModerationItem["status"]) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  return "Ditolak";
}

export default function AdminModerationPage() {
  const { toast } = useAdminToast();
  const [items, setItems] = useState<AdminModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<AdminModerationItem | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchModerationQueue();
    setItems(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleResolve(id: string, decision: "approved" | "rejected") {
    setProcessing(true);
    try {
      await resolveModeration(id, decision);
      toast(decision === "approved" ? "Konten disetujui." : "Konten ditolak.");
      setPreview(null);
      await load();
    } catch {
      toast("Gagal memproses moderasi.", "error");
    } finally {
      setProcessing(false);
    }
  }

  const columns: DataTableColumn<AdminModerationItem>[] = [
    {
      key: "contentType",
      header: "Tipe",
      sortable: true,
      render: (row) => row.contentType,
    },
    {
      key: "contentPreview",
      header: "Pratinjau",
      render: (row) => (
        <p className="line-clamp-2 max-w-md text-sm">{row.contentPreview}</p>
      ),
    },
    {
      key: "reason",
      header: "Alasan",
      render: (row) => row.reason,
    },
    {
      key: "reporterName",
      header: "Pelapor",
      render: (row) => (
        <div>
          <p className="text-sm">{row.reporterName ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{row.reporterEmail}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>,
    },
    {
      key: "actions",
      header: "Aksi",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={() => setPreview(row)}>
            Detail
          </Button>
          {row.status === "pending" && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => handleResolve(row.id, "approved")}
                aria-label="Setujui"
              >
                <Check className="size-3.5 text-emerald" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => handleResolve(row.id, "rejected")}
                aria-label="Tolak"
              >
                <X className="size-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Antrean Moderasi</h1>
        <p className="text-sm text-muted-foreground">
          Tinjau konten yang dilaporkan dan ambil tindakan moderasi.
        </p>
      </div>

      <DataTable
        data={items}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["contentType", "reason", "reporterName"]}
        searchPlaceholder="Cari laporan..."
        emptyMessage="Tidak ada item moderasi."
      />

      <FormModal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Detail Laporan"
        size="lg"
        footer={
          preview?.status === "pending" ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                disabled={processing}
                onClick={() => preview && handleResolve(preview.id, "rejected")}
              >
                Tolak
              </Button>
              <Button
                disabled={processing}
                onClick={() => preview && handleResolve(preview.id, "approved")}
              >
                Setujui
              </Button>
            </div>
          ) : undefined
        }
      >
        {preview && (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Pratinjau Konten</p>
              <p className="mt-1 rounded-lg bg-muted/60 p-3">{preview.contentPreview}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Tipe</p>
                <p>{preview.contentType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID Konten</p>
                <p className="font-mono text-xs">{preview.contentId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pelapor</p>
                <p>{preview.reporterName ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{preview.reporterEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alasan</p>
                <p>{preview.reason}</p>
              </div>
            </div>
            {preview.history.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Riwayat Aksi
                </p>
                <ul className="space-y-2">
                  {preview.history.map((h) => (
                    <li key={h.id} className="flex justify-between rounded bg-muted/60 px-3 py-2">
                      <span>
                        {h.action} — {h.actor}
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString("id-ID")}
                      </time>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </div>
  );
}
