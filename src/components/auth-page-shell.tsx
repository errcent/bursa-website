"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";

import { SnapPresence } from "@/components/motion/snap";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="auth-shell">
        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
              Bursa
            </Link>
            <p className="eyebrow mt-6">Akun pelajar</p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
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
      <div className="relative w-full max-w-md">
        <SnapPresence seed={5} className="mb-8 text-center">
          <Link href="/" className="font-heading text-2xl font-semibold tracking-tight">
            Bursa
          </Link>
          <p className="eyebrow mt-6">Akun pelajar</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
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
