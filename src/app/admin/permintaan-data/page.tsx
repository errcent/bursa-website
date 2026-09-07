"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type DsarRow = {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  requestType: string;
  subjectType: string | null;
  status: string;
  details: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  IN_REVIEW: "outline",
  COMPLETED: "default",
  REJECTED: "destructive",
};

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request gagal");
  return data;
}

export default function AdminDsarPage() {
  const { toast } = useAdminToast();
  const [rows, setRows] = useState<DsarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DsarRow | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<DsarRow[]>("/api/admin/data-subject-requests");
      setRows(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memuat permintaan.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: DsarRow["status"], notify = true) {
    if (!selected) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/data-subject-requests/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes, notify }),
      });
      toast("Status diperbarui.");
      setSelected(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memperbarui.");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataTableColumn<DsarRow>[] = [
    {
      key: "referenceCode",
      header: "Referensi",
      render: (row) => <span className="font-mono text-xs">{row.referenceCode}</span>,
    },
    { key: "fullName", header: "Nama", render: (row) => row.fullName },
    { key: "email", header: "Email", render: (row) => row.email },
    { key: "requestType", header: "Jenis", render: (row) => row.requestType },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>{row.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Diajukan",
      render: (row) => new Date(row.createdAt).toLocaleString("id-ID"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelected(row);
            setNotes(row.adminNotes ?? "");
          }}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Permintaan Data (DSAR)</h1>
        <p className="mt-1 text-sm text-muted-foreground">Antrian permintaan hak subjek data dari Pusat Privasi.</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="Belum ada permintaan."
          getRowId={(row) => row.id}
        />
      )}

      {selected && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">{selected.referenceCode}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{selected.details}</p>
          <textarea
            className="mt-4 min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan admin (internal)"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {(["IN_REVIEW", "COMPLETED", "REJECTED"] as const).map((status) => (
              <Button key={status} type="button" size="sm" disabled={saving} onClick={() => updateStatus(status)}>
                {status}
              </Button>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
