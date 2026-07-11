import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";

export function LabToolLayout({
  icon: Icon,
  tag,
  title,
  description,
  assumptions,
  children,
}: {
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  /** Optional list of plain-language assumptions/disclaimers for the tool's math. */
  assumptions?: string[];
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip">
          <div className="container-page py-8 sm:py-10">
            <Reveal>
              <Link
                href="/lab"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Kembali ke Lab
              </Link>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow mb-1.5">{tag}</p>
                  <h1 className="page-hero-title text-gradient">{title}</h1>
                </div>
              </div>
              <p className="section-copy mt-3 max-w-2xl">{description}</p>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight">
          <Reveal delay={0.05}>{children}</Reveal>

          {assumptions && assumptions.length > 0 && (
            <Reveal delay={0.1} className="mt-8">
              <div className="rounded-2xl border border-border/60 bg-accent-soft/40 p-4 sm:p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Asumsi &amp; batasan
                </p>
                <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-muted-foreground">
                  {assumptions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
