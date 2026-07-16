"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

import { cn } from "@/lib/utils";

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (!match) continue;
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }
  return headings;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function MarkdownDocument({
  markdown,
  showToc = true,
  className,
}: {
  markdown: string;
  showToc?: boolean;
  className?: string;
}) {
  const headings = showToc ? extractHeadings(markdown) : [];

  return (
    <article className={cn("max-w-3xl", className)}>
      {headings.length > 0 && (
        <nav className="mt-2 rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
          <p className="text-sm font-medium">Daftar isi</p>
          <ol className="mt-3 flex flex-col gap-2">
            {headings.map((h) => (
              <li key={h.id} className={h.level === 3 ? "pl-4" : undefined}>
                <a href={`#${h.id}`} className="link-muted text-sm">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="prose-trust mt-10">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => {
              const text = String(children);
              const id = slugifyHeading(text.replace(/\*\*/g, ""));
              return (
                <h2 id={id} className="section-title scroll-mt-24">
                  {children}
                </h2>
              );
            },
            h3: ({ children }) => {
              const text = String(children);
              const id = slugifyHeading(text.replace(/\*\*/g, ""));
              return (
                <h3 id={id} className="mt-6 text-lg font-semibold scroll-mt-24">
                  {children}
                </h3>
              );
            },
            p: ({ children }) => <p className="section-copy mt-3">{children}</p>,
            ul: ({ children }) => (
              <ul className="mt-3 flex flex-col gap-2 pl-5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mt-3 list-decimal flex flex-col gap-2 pl-5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
            ),
            a: ({ href, children }) => {
              const isInternal = href?.startsWith("/");
              if (isInternal && href) {
                return (
                  <Link href={href} className="link-muted font-medium text-foreground">
                    {children}
                  </Link>
                );
              }
              return (
                <a
                  href={href}
                  className="link-muted font-medium text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[28rem] text-left text-sm">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/50 text-foreground">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 font-medium">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border-t border-border px-3 py-2 text-muted-foreground">
                {children}
              </td>
            ),
            tr: ({ children }) => <tr className="border-t border-border">{children}</tr>,
            code: ({ children }) => (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-xs">
                {children}
              </pre>
            ),
            hr: () => <hr className="my-8 border-border" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}
