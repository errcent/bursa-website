"use client";

import { useCallback, useEffect, useState } from "react";

import { useAdminToast } from "@/components/admin/admin-toast";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUsers, updateUserRole } from "@/lib/admin/api";
import type { AdminUser, AdminUserRole } from "@/lib/admin/types";

const ROLES: AdminUserRole[] = ["learner", "mentor", "admin", "developer"];

const roleLabels: Record<AdminUserRole, string> = {
  learner: "Pelajar",
  mentor: "Mentor",
  admin: "Admin",
  developer: "Developer",
};

export default function AdminUsersPage() {
  const { toast } = useAdminToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchUsers();
    setUsers(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(user: AdminUser, role: AdminUserRole) {
    if (user.role === role) return;
    try {
      await updateUserRole(user.id, role);
      toast(`Peran ${user.name} diubah menjadi ${roleLabels[role]}.`);
      await load();
    } catch {
      toast("Gagal mengubah peran pengguna.", "error");
    }
  }

  const filtered =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const columns: DataTableColumn<AdminUser>[] = [
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
    {
      key: "role",
      header: "Peran",
      sortable: true,
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => changeRole(row, e.target.value as AdminUserRole)}
          className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "accent" : "destructive"}>
          {row.status === "active" ? "Aktif" : "Suspended"}
        </Badge>
      ),
    },
    {
      key: "enrollmentCount",
      header: "Enrollment",
      sortable: true,
      render: (row) => row.enrollmentCount,
    },
    {
      key: "createdAt",
      header: "Bergabung",
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString("id-ID"),
    },
  ];

  if (loading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Manajemen Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Lihat daftar pengguna, ubah peran, dan filter berdasarkan status.
        </p>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        searchKeys={["name", "email"]}
        searchPlaceholder="Cari pengguna..."
        toolbar={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AdminUserRole | "all")}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">Semua peran</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
