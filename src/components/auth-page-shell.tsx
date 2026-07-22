"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { SnapPresence } from "@/components/motion/snap";
import { Button } from "@/components/ui/button";

function AuthMobileBackButton({ href }: { href: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-4 z-50 size-11 rounded-full border border-border/60 bg-card/90 shadow-sm backdrop-blur-sm sm:hidden"
      style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      aria-label="Kembali"
      render={<Link href={href} />}
    >
      <ArrowLeft className="size-5" />
    </Button>
  );
}

export function AuthPageShell({
  title,
  description,
  children,
  showMobileBack = false,
  mobileBackHref = "/",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Fixed back button — top-left, mobile viewport only. */
  showMobileBack?: boolean;
  mobileBackHref?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const mobileBack = showMobileBack ? <AuthMobileBackButton href={mobileBackHref} /> : null;

  if (prefersReducedMotion) {
    return (
      <div className="auth-shell">
        {mobileBack}
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
              Bursa
            </Link>
            <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
              {title}
            </h1>
            <p className="section-copy mt-2">{description}</p>
          </div>
          <div className="auth-card">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      {mobileBack}
      <div className="relative w-full max-w-md">
        <SnapPresence seed={5} className="mb-8 text-center">
          <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
            Bursa
          </Link>
          <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
            {title}
          </h1>
          <p className="section-copy mt-2">{description}</p>
        </SnapPresence>

        <SnapPresence seed={8} className="auth-card" delay={0.08}>
          {children}
        </SnapPresence>
      </div>
    </div>
  );
}
