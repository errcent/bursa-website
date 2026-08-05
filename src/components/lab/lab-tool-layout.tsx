"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LabAssumptionsPanel } from "@/components/lab/lab-field";
import { LabToolMobileNav, LabToolSidebar } from "@/components/lab/lab-tool-sidebar";
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
          <div className="container-page py-4 sm:py-5">
            <Link
              href="/lab"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Bursa Lab
            </Link>
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {tag} · Client-side · input tidak dikirim ke server
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
                <details className="group mt-8 surface-card overflow-hidden">
                  <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-semibold tracking-tight">Tool terkait</span>
                  </summary>
                  <ul className="border-t border-border/45 px-4 py-3 sm:px-5">
                    {relatedTools.map((tool) => (
                      <li key={tool.id}>
                        <Link
                          href={tool.href}
                          className="block py-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
                        >
                          {tool.shortTitle ?? tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
