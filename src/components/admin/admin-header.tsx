"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "Admin",
  pendapatan: "Pendapatan",
  mentors: "Mentor",
  courses: "Kelas",
  "change-requests": "Usulan Mentor",
  "branch-change-requests": "Usulan Cabang",
  "chat-rooms": "Chat Room",
  moderation: "Moderasi",
  users: "Pengguna",
  settings: "Pengaturan",
};

export function AdminHeader({ segments }: { segments: string[] }) {
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
    </header>
  );
}
