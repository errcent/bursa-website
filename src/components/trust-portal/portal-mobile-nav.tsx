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
    <div className="mb-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto">
              <Menu className="size-4" />
              Navigasi {portalLabel}
            </Button>
          }
        />
        <SheetContent side="left" className="w-[min(100%,20rem)]">
          <SheetHeader>
            <SheetTitle>{portalLabel}</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 flex flex-col gap-0.5" aria-label={`Navigasi mobile ${portalLabel}`}>
            <Link
              href={`/${portalBase}`}
              aria-current={!activeSlug || activeSlug === "hub" ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm transition-colors",
                !activeSlug || activeSlug === "hub"
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              Beranda
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                aria-current={activeSlug === item.slug ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm transition-colors",
                  activeSlug === item.slug
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
