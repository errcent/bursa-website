import type { UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  learner: "Pelajar",
  mentor: "Mentor",
  admin: "Admin",
  developer: "Developer",
};

/** Consumer UI: default learner role is hidden — only privileged roles get a badge. */
export function getConsumerRoleLabel(role: UserRole | undefined | null): string | null {
  if (!role || role === "learner") return null;
  return ROLE_LABELS[role];
}

export type RoleNavLink = {
  href: string;
  label: string;
  description?: string;
};

/** Navbar / account links shown for each role (learner dashboard + privileged panels). */
export function getRoleNavLinks(role: UserRole | undefined | null): RoleNavLink[] {
  if (!role) return [];

  switch (role) {
    case "learner":
      return [{ href: "/dashboard", label: "Dashboard", description: "Ringkasan belajar" }];
    case "admin":
      return [{ href: "/admin", label: "Admin Panel", description: "CRUD platform" }];
    case "mentor":
      return [{ href: "/mentor", label: "Mentor Panel", description: "Kelola ruang & profil" }];
    case "developer":
      return [
        { href: "/developer", label: "Developer QC", description: "Quality control" },
        { href: "/developer/docs", label: "Dev Docs", description: "Dokumentasi arsitektur" },
      ];
    default:
      return [];
  }
}

export function canAccessAdminPanel(role: UserRole | undefined | null): boolean {
  return role === "admin" || role === "developer";
}

export function canMutateAdmin(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

export function canAccessMentorPanel(role: UserRole | undefined | null): boolean {
  return role === "mentor" || role === "developer";
}

export function canMutateMentor(role: UserRole | undefined | null): boolean {
  return role === "mentor";
}

export function canAccessDeveloperPanel(role: UserRole | undefined | null): boolean {
  return role === "developer";
}

export function isQcViewer(role: UserRole | undefined | null): boolean {
  return role === "developer";
}
