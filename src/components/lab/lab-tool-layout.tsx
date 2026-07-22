"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, FlaskConical } from "lucide-react";
import { useState } from "react";

import { LabAssumptionsPanel } from "@/components/lab/lab-field";
import { LabToolMobileNav, LabToolSidebar } from "@/components/lab/lab-tool-sidebar";
import { LabToolCard } from "@/components/lab/lab-tool-card";
import { HeroLivingBackground } from "@/components/hero-living-bg";
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
      <main className="flex-1 overflow-x-clip">
        <div className="hero-cinematic page-header-strip relative overflow-hidden border-b border-border/40">
          <HeroLivingBackground />
          <div className="container-page relative z-10 py-8 sm:py-10">
            <Reveal>
              <Link
                href="/lab"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Bursa Lab
              </Link>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="lab-tool-card-icon mt-0.5 size-11 rounded-2xl">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="eyebrow mb-1.5">{tag}</p>
                    <h1 className="page-hero-title text-gradient text-[1.75rem] sm:text-4xl md:text-[2.75rem]">
                      {title}
                    </h1>
                    <p className="section-copy mt-2 max-w-2xl text-base sm:text-[0.95rem]">
                      {description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-border/55 bg-surface/50 px-4 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-accent/30 hover:text-foreground"
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

        <div className="container-page section-tight pb-16 pt-6 sm:pt-8">
          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
            <LabToolSidebar currentToolId={toolId} />

            <div className="min-w-0">
              <LabToolMobileNav currentToolId={toolId} />
              <Reveal delay={0.04}>{children}</Reveal>

              {assumptions && assumptions.length > 0 && (
                <Reveal delay={0.08} className="mt-8">
                  <LabAssumptionsPanel items={assumptions} />
                </Reveal>
              )}

              {relatedTools.length > 0 && (
                <Reveal delay={0.1} className="mt-10">
                  <div className="mb-4 border-b border-border/40 pb-4">
                    <p className="eyebrow mb-1">Terkait</p>
                    <h2 className="section-title">Tool serupa</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
