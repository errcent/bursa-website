import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LifeBuoy,
  ListVideo,
  Newspaper,
  Settings,
  UserRound,
} from "lucide-react";

import type { RoleNavLink } from "@/lib/auth/roles";

export type AccountMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export type AccountMenuSection = {
  label?: string;
  items: AccountMenuItem[];
};

const ACCOUNT_SECTIONS: AccountMenuSection[] = [
  {
    label: "Akun",
    items: [
      { href: "/profil", label: "Profil", icon: UserRound, description: "Identitas & bio" },
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Ringkasan belajar",
      },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/playlist", label: "Playlist", icon: ListVideo, description: "Koleksi tersimpan" },
      { href: "/artikel", label: "Artikel", icon: Newspaper, description: "Tulisan & insight" },
    ],
  },
  {
    label: "Preferensi",
    items: [
      { href: "/pengaturan", label: "Pengaturan", icon: Settings, description: "Tampilan & akun" },
      { href: "/bantuan", label: "Pusat Bantuan", icon: LifeBuoy, description: "FAQ & dukungan" },
    ],
  },
];

export function getAccountMenuSections(roleLinks: RoleNavLink[] = []): AccountMenuSection[] {
  const dashboardHref = "/dashboard";
  const privilegedLinks = roleLinks.filter((link) => link.href !== dashboardHref);

  if (privilegedLinks.length === 0) {
    return ACCOUNT_SECTIONS;
  }

  const [accountSection, ...rest] = ACCOUNT_SECTIONS;

  return [
    accountSection,
    {
      label: "Akses",
      items: privilegedLinks.map((link) => ({
        href: link.href,
        label: link.label,
        icon: LayoutDashboard,
        description: link.description,
      })),
    },
    ...rest,
  ];
}
