"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PortalNavItem } from "@/lib/public-documents/types";

export function PortalMobileNav({
  portalBase,
  portalLabel,
  navItems,
  activeSlug,
}: {
  portalBase: string;
  portalLabel: string;
  navItems: PortalNavItem[];
  activeSlug?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [activeSlug]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="lg:hidden">
            <Menu className="size-4" />
            Daftar isi
          </Button>
        }
      />
      <SheetContent side="left" className="w-[min(100%,20rem)]">
        <SheetHeader>
          <SheetTitle>{portalLabel}</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1" aria-label={`Navigasi mobile ${portalLabel}`}>
          <Link
            href={`/${portalBase}`}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm",
              !activeSlug || activeSlug === "hub"
                ? "bg-primary/15 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            Beranda
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm",
                activeSlug === item.slug
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
