"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LabAssumptionsPanel } from "@/components/lab/lab-field";
import { LabToolMobileNav, LabToolSidebar } from "@/components/lab/lab-tool-sidebar";
import { LabToolCard } from "@/components/lab/lab-tool-card";
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
  const relatedTools = getRelatedLabTools(toolId);
  const category = getLabTool(toolId)?.category;

  return (
    <>
      <SiteNavbar />
      <main className="flex-1 overflow-x-clip">
        <div className="border-b border-border/40 bg-surface/30">
          <div className="container-page py-5 sm:py-6">
            <Link
              href="/lab"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Bursa Lab
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border/50 bg-muted/25 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {tag}
              </span>
              <span className="rounded-md border border-border/50 bg-muted/25 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Client-side
              </span>
            </div>
            <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="container-page section-tight pb-16 pt-6 sm:pt-8">
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
            {category && <LabToolSidebar currentToolId={toolId} category={category} />}

            <div className="min-w-0">
              <LabToolMobileNav currentToolId={toolId} category={category} />
              {children}

              {assumptions && assumptions.length > 0 && (
                <div className="mt-8">
                  <LabAssumptionsPanel items={assumptions} />
                </div>
              )}

              {relatedTools.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-sm font-semibold tracking-tight">Tool terkait</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {relatedTools.map((tool) => (
                      <LabToolCard key={tool.id} tool={tool} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
