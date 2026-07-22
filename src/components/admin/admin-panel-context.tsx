"use client";

import { createContext, useContext, useMemo } from "react";

import { useAuth } from "@/components/auth-provider";
import { canMutateAdmin } from "@/lib/auth/roles";

const AdminPanelContext = createContext<{ readOnly: boolean }>({ readOnly: false });

export function AdminPanelProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const readOnly = !canMutateAdmin(session?.role);

  const value = useMemo(() => ({ readOnly }), [readOnly]);

  return <AdminPanelContext.Provider value={value}>{children}</AdminPanelContext.Provider>;
}

export function useAdminPanel() {
  return useContext(AdminPanelContext);
}
