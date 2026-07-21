"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, FlaskConical } from "lucide-react";
import { useState } from "react";

import { LabToolMobileNav, LabToolSidebar } from "@/components/lab/lab-tool-sidebar";
import { LabToolCard } from "@/components/lab/lab-tool-card";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavbar } from "@/components/site-navbar";
import { getLabTool, getRelatedLabTools } from "@/lib/lab/tools";

export function LabToolLayout({
  toolId,
  tag,
  title,
  description,
  assumptions,
  children,
}: {
  toolId: string;
  tag: string;
  title: string;
  description: string;
  assumptions?: string[];
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const relatedTools = getRelatedLabTools(toolId);
  const Icon = getLabTool(toolId)?.icon ?? FlaskConical;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <SiteNavbar />
      <main className="flex-1">
        <div className="hero-cinematic page-header-strip border-b border-border/40">
          <div className="container-page py-8 sm:py-10">
            <Reveal>
              <Link
                href="/lab"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Bursa Lab
              </Link>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/25 bg-accent-soft text-accent shadow-[0_0_32px_var(--glow)]">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow mb-1.5">{tag}</p>
                    <h1 className="page-hero-title text-gradient">{title}</h1>
                    <p className="section-copy mt-2 max-w-2xl">{description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-border/70 bg-muted/30 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-accent/30 hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-profit" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Salin link
                    </>
                  )}
                </button>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="container-page section-tight pb-16">
          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
            <LabToolSidebar currentToolId={toolId} />

            <div className="min-w-0">
              <LabToolMobileNav currentToolId={toolId} />
              <Reveal delay={0.05}>{children}</Reveal>

              {assumptions && assumptions.length > 0 && (
                <Reveal delay={0.1} className="mt-8">
                  <details className="group surface-card overflow-hidden">
                    <summary className="cursor-pointer list-none px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold tracking-tight">
                          Asumsi &amp; batasan perhitungan
                        </p>
                        <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
                          ▼
                        </span>
                      </div>
                    </summary>
                    <div className="border-t border-border/50 px-5 pb-5 sm:px-6 sm:pb-6">
                      <ul className="flex flex-col gap-2 pt-4 text-sm leading-relaxed text-muted-foreground">
                        {assumptions.map((item) => (
                          <li key={item} className="flex gap-2.5">
                            <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </Reveal>
              )}

              {relatedTools.length > 0 && (
                <Reveal delay={0.12} className="mt-10">
                  <div className="mb-4">
                    <p className="eyebrow mb-1">Terkait</p>
                    <h2 className="section-title">Tool serupa</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {relatedTools.map((tool) => (
                      <LabToolCard key={tool.id} tool={tool} compact />
                    ))}
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
