"use client";

import Link from "next/link";
import {
  ChevronRight,
  Code2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRoleNavLinks } from "@/lib/auth/roles";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function RoleMenuIcon({ href }: { href: string }) {
  if (href.startsWith("/admin")) return <Shield className="size-4" />;
  if (href.startsWith("/mentor")) return <GraduationCap className="size-4" />;
  return <Code2 className="size-4" />;
}

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
  const { session, logout } = useAuth();
  const router = useRouter();
  const roleLinks = getRoleNavLinks(session?.role);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
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

        <div className="relative z-30 flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{session?.name}</p>
            <p className="text-xs text-muted-foreground">{session?.email}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative z-30 flex size-9 items-center justify-center rounded-full border border-border outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Menu akun ${session?.name ?? "admin"}`}
            >
              <Avatar className="size-8 pointer-events-none">
                <AvatarFallback className="bg-primary/20 text-xs">
                  {initials(session?.name ?? "A")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-52">
              <div className="px-2 py-1.5 sm:hidden">
                <p className="truncate text-sm font-medium">{session?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.email}</p>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem render={<Link href="/dashboard" />}>
                <LayoutDashboard className="size-4" />
                Dashboard
              </DropdownMenuItem>
              {roleLinks.map((link) => (
                <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
                  <RoleMenuIcon href={link.href} />
                  {link.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem render={<Link href="/profil" />}>
                <UserRound className="size-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/pengaturan" />}>
                <Settings className="size-4" />
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="size-4" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
