import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  DollarSign,
  FileText,
  Inbox,
  LayoutDashboard,
  ListVideo,
  Mail,
  Settings,
  Shield,
  Users,
  UserSquare2,
} from "lucide-react";

export const ADMIN_NAV_LINKS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pendapatan", label: "Pendapatan", icon: DollarSign },
  { href: "/admin/mentors", label: "Mentor", icon: UserSquare2 },
  { href: "/admin/mentor-applications", label: "Aplikasi Mentor", icon: Inbox },
  { href: "/admin/courses", label: "Kelas", icon: BookOpen },
  { href: "/admin/playlists", label: "Playlist", icon: ListVideo },
  { href: "/admin/change-requests", label: "Usulan Mentor", icon: ClipboardList },
  { href: "/admin/moderation", label: "Moderasi", icon: Shield },
  { href: "/admin/dokumen-publik", label: "Dokumen Publik", icon: FileText },
  { href: "/admin/waitlist", label: "Waitlist", icon: Mail },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];
