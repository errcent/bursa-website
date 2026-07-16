"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Pencil, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { FormModal } from "@/components/admin/form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PORTAL_ROUTE } from "@/lib/public-documents/types";

type PublicDoc = {
  id: string;
  portal: "PRIVACY" | "TRUST" | "LEGAL";
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  markdownBody: string;
  status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  version: number;
  sortOrder: number;
  updatedAt: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  REVIEW: "outline",
  PUBLISHED: "default",
  ARCHIVED: "destructive",
};

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request gagal");
  return data;
}

export default function AdminPublicDocumentsPage() {
  const { toast } = useAdminToast();
  const [docs, setDocs] = useState<PublicDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState<PublicDoc | null>(null);
  const [markdownBody, setMarkdownBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<PublicDoc[]>("/api/admin/public-documents");
      setDocs(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal memuat dokumen.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      await adminFetch("/api/admin/public-documents/sync", { method: "POST" });
      toast("Sync dari vault selesai.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Sync gagal.");
    } finally {
      setSyncing(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await adminFetch(`/api/admin/public-documents/${id}/publish`, { method: "POST" });
      toast("Dokumen dipublish.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Publish gagal.");
    }
  }

  function openEdit(doc: PublicDoc) {
    setEditing(doc);
    setMarkdownBody(doc.markdownBody);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await adminFetch(`/api/admin/public-documents/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdownBody }),
      });
      toast("Dokumen disimpan.");
      setEditing(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Simpan gagal.");
    } finally {
      setSaving(false);
    }
  }

  function previewHref(doc: PublicDoc) {
    const base = PORTAL_ROUTE[doc.portal];
    const path = doc.slug === "hub" ? `/${base}` : `/${base}/${doc.slug}`;
    return path;
  }

  const columns: DataTableColumn<PublicDoc>[] = [
    {
      key: "portal",
      header: "Portal",
      render: (row) => (
        <Badge variant="outline">{row.portal === "PRIVACY" ? "Privasi" : "Kepercayaan"}</Badge>
      ),
    },
    { key: "slug", header: "Slug", render: (row) => <code className="text-xs">{row.slug}</code> },
    { key: "title", header: "Judul", render: (row) => row.title },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
    },
    { key: "version", header: "Ver.", render: (row) => String(row.version) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(row)}>
            <Pencil className="size-4" />
          </Button>
          <Link href={previewHref(row)} target="_blank">
            <Button type="button" variant="ghost" size="icon-sm">
              <ExternalLink className="size-4" />
            </Button>
          </Link>
          {row.status !== "PUBLISHED" && (
            <Button type="button" variant="outline" size="sm" onClick={() => handlePublish(row.id)}>
              Publish
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Dokumen Publik</h1>
          <p className="text-sm text-muted-foreground">
            Kelola Privacy Center & Trust Center — sync dari vault, edit, publish.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={handleSync} disabled={syncing}>
            <Upload className="size-4" />
            {syncing ? "Syncing..." : "Sync Vault"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
        Dokumen legal masih <strong>DRAFT</strong> — publish final butuh review advokat + persetujuan founder.
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={docs}
          emptyMessage="Belum ada dokumen. Klik Sync Vault."
          getRowId={(row) => row.id}
        />
      )}

      <FormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit: ${editing.title}` : "Edit dokumen"}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <label htmlFor="md-body" className="text-sm font-medium">
            Markdown
          </label>
          <textarea
            id="md-body"
            value={markdownBody}
            onChange={(e) => setMarkdownBody(e.target.value)}
            rows={20}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary/50"
          />
        </div>
      </FormModal>
    </div>
  );
}
