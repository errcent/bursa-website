"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

import { syncNavbarRouteContext } from "@/lib/nav/navbar-intro-state";

/** Keeps navbar intro context in sync on every route, including pages without SiteNavbar. */
export function NavbarRouteTracker() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    syncNavbarRouteContext(pathname);
  }, [pathname]);

  return null;
}
