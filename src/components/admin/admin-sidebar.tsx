"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ADMIN_NAV_LINKS } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/40 lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/admin" className="block" aria-label="Bursa Admin">
          <BrandLogo variant="product" slot="productAdmin" decorative className="mb-1" />
          <p className="font-heading text-lg font-semibold text-foreground">Admin Panel</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigasi admin">
        {ADMIN_NAV_LINKS.map((link) => {
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
