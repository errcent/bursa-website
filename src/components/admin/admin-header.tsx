"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ADMIN_NAV_LINKS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

const labelMap: Record<string, string> = {
  admin: "Admin",
  pendapatan: "Pendapatan",
  mentors: "Mentor",
  "mentor-applications": "Aplikasi Mentor",
  courses: "Kelas",
  playlists: "Playlist",
  "change-requests": "Usulan Mentor",
  moderation: "Moderasi",
  "dokumen-publik": "Dokumen Publik",
  waitlist: "Waitlist",
  users: "Pengguna",
  settings: "Pengaturan",
};

export function AdminHeader({ segments }: { segments: string[] }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            </li>
            {segments.map((segment, index) => {
              const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === segments.length - 1;
              return (
                <li key={href} className="flex min-w-0 items-center gap-1">
                  <ChevronRight className="size-3.5 shrink-0 opacity-60" />
                  {isLast ? (
                    <span className="truncate font-medium text-foreground">
                      {labelMap[segment] ?? segment}
                    </span>
                  ) : (
                    <Link href={href} className="truncate hover:text-foreground">
                      {labelMap[segment] ?? segment}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <nav
        className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden"
        aria-label="Navigasi admin"
      >
        {ADMIN_NAV_LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
