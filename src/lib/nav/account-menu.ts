import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LifeBuoy,
  Newspaper,
  Settings,
} from "lucide-react";

import type { RoleNavLink } from "@/lib/auth/roles";

export type AccountMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isRoleLink?: boolean;
};

const BASE_MENU_ITEMS: AccountMenuItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/artikel", label: "Artikel", icon: Newspaper },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
  { href: "/bantuan", label: "Pusat Bantuan", icon: LifeBuoy },
];

export function getAccountMenuItems(roleLinks: RoleNavLink[] = []): AccountMenuItem[] {
  const dashboardHref = "/dashboard";
  const privilegedLinks = roleLinks.filter((link) => link.href !== dashboardHref);

  if (privilegedLinks.length === 0) {
    return BASE_MENU_ITEMS;
  }

  const [dashboard, ...rest] = BASE_MENU_ITEMS;
  const roleItems: AccountMenuItem[] = privilegedLinks.map((link) => ({
    href: link.href,
    label: link.label,
    icon: LayoutDashboard,
    isRoleLink: true,
  }));

  return [dashboard, ...roleItems, ...rest];
}
