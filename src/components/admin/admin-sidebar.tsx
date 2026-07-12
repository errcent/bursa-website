"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  DollarSign,
  GitBranch,
  LayoutDashboard,
  ListVideo,
  MessageSquare,
  Settings,
  Shield,
  Users,
  UserSquare2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pendapatan", label: "Pendapatan", icon: DollarSign },
  { href: "/admin/mentors", label: "Mentor", icon: UserSquare2 },
  { href: "/admin/courses", label: "Kelas", icon: BookOpen },
  { href: "/admin/playlists", label: "Playlist", icon: ListVideo },
  { href: "/admin/change-requests", label: "Usulan Mentor", icon: ClipboardList },
  { href: "/admin/branch-change-requests", label: "Usulan Cabang", icon: GitBranch },
  { href: "/admin/chat-rooms", label: "Chat Room", icon: MessageSquare },
  { href: "/admin/moderation", label: "Moderasi", icon: Shield },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/40 lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin" className="block">
          <p className="font-heading text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Bursa
          </p>
          <p className="font-heading text-lg font-semibold text-foreground">Admin Panel</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigasi admin">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Kembali ke situs
        </Link>
      </div>
    </aside>
  );
}
