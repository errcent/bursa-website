import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
} from "docx";
import { jsPDF } from "jspdf";
import TurndownService from "turndown";

import type { LessonNote } from "@/lib/lesson-notes/types";

export type NoteExportFormat = "md" | "docx" | "pdf" | "txt" | "notion";

export interface NoteExportMeta {
  courseTitle: string;
  lessonTitle: string;
  exportedAt?: Date;
}

type InlineNode =
  | { type: "text"; text: string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean }
  | { type: "link"; href: string; text: string; bold?: boolean; italic?: boolean; underline?: boolean; code?: boolean };

type BlockNode =
  | { type: "heading"; level: 1 | 2 | 3; inlines: InlineNode[] }
  | { type: "paragraph"; inlines: InlineNode[] }
  | { type: "list-item"; ordered: boolean; index: number; inlines: InlineNode[] }
  | { type: "blockquote"; inlines: InlineNode[] }
  | { type: "code-block"; text: string };

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(h[1-6]|li|div|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isLikelyHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function toMarkdownBody(content: string) {
  if (!isLikelyHtml(content)) return content;
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  return turndown.turndown(content).trim();
}

function parseInlines(html: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const tokenRe =
    /<(strong|b|em|i|u|code|a)(\s[^>]*)?>|<\/(strong|b|em|i|u|code|a)>|<br\s*\/?>|([^<]+)/gi;
  const stack: Array<"bold" | "italic" | "underline" | "code" | "link"> = [];
  let linkHref = "";

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(html)) !== null) {
    if (match[4] !== undefined) {
      const text = decodeEntities(match[4]);
      if (!text) continue;
      const marks = {
        bold: stack.includes("bold"),
        italic: stack.includes("italic"),
        underline: stack.includes("underline"),
        code: stack.includes("code"),
      };
      if (stack.includes("link") && linkHref) {
        nodes.push({ type: "link", href: linkHref, text, ...marks });
      } else {
        nodes.push({ type: "text", text, ...marks });
      }
      continue;
    }

    if (match[0].toLowerCase().startsWith("<br")) {
      nodes.push({ type: "text", text: "\n" });
      continue;
    }

    const openTag = (match[1] || "").toLowerCase();
    const closeTag = (match[3] || "").toLowerCase();

    if (openTag === "strong" || openTag === "b") stack.push("bold");
    else if (openTag === "em" || openTag === "i") stack.push("italic");
    else if (openTag === "u") stack.push("underline");
    else if (openTag === "code") stack.push("code");
    else if (openTag === "a") {
      const hrefMatch = /href=["']([^"']+)["']/i.exec(match[2] || "");
      linkHref = hrefMatch?.[1] ?? "";
      stack.push("link");
    } else if (closeTag) {
      const mapped =
        closeTag === "strong" || closeTag === "b"
          ? "bold"
          : closeTag === "em" || closeTag === "i"
            ? "italic"
            : closeTag === "u"
              ? "underline"
              : closeTag === "code"
                ? "code"
                : closeTag === "a"
                  ? "link"
                  : null;
      if (mapped) {
        const idx = stack.lastIndexOf(mapped);
        if (idx >= 0) stack.splice(idx, 1);
        if (mapped === "link") linkHref = "";
      }
    }
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text: "" }];
}

function parseBlocks(content: string): BlockNode[] {
  if (!isLikelyHtml(content)) {
    return content
      .split(/\n{2,}/)
      .map((para) => ({
        type: "paragraph" as const,
        inlines: [{ type: "text" as const, text: para }],
      }));
  }

  const blocks: BlockNode[] = [];
  const normalized = content
    .replace(/\n+/g, " ")
    .replace(/<br\s*\/?>/gi, "<br />");

  const blockRe =
    /<(h([123]))[^>]*>([\s\S]*?)<\/\1>|<(p)[^>]*>([\s\S]*?)<\/p>|<(blockquote)[^>]*>([\s\S]*?)<\/blockquote>|<(pre)[^>]*>([\s\S]*?)<\/pre>|<(ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi;

  let match: RegExpExecArray | null;
  let orderedCounter = 0;

  while ((match = blockRe.exec(normalized)) !== null) {
    if (match[1]) {
      const level = Number(match[2]) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, inlines: parseInlines(match[3] || "") });
      continue;
    }
    if (match[4] === "p") {
      blocks.push({ type: "paragraph", inlines: parseInlines(match[5] || "") });
      continue;
    }
    if (match[6] === "blockquote") {
      const inner = (match[7] || "").replace(/<\/?p[^>]*>/gi, " ");
      blocks.push({ type: "blockquote", inlines: parseInlines(inner) });
      continue;
    }
    if (match[8] === "pre") {
      blocks.push({ type: "code-block", text: stripHtml(match[9] || "") });
      continue;
    }
    if (match[10]) {
      const ordered = match[10].toLowerCase() === "ol";
      if (ordered) orderedCounter = 0;
      const items = [...(match[11] || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
      for (const item of items) {
        if (ordered) orderedCounter += 1;
        blocks.push({
          type: "list-item",
          ordered,
          index: orderedCounter,
          inlines: parseInlines(item[1] || ""),
        });
      }
    }
  }

  if (blocks.length === 0) {
    const plain = stripHtml(content);
    if (plain) {
      blocks.push({ type: "paragraph", inlines: [{ type: "text", text: plain }] });
    }
  }

  return blocks;
}

function inlinesToPlain(inlines: InlineNode[]) {
  return inlines.map((n) => n.text).join("");
}

function sortedNotes(notes: LessonNote[]) {
  return [...notes].sort((a, b) => {
    if (a.timestampSeconds !== b.timestampSeconds) {
      return a.timestampSeconds - b.timestampSeconds;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function buildMarkdownExport(notes: LessonNote[], meta: NoteExportMeta) {
  const lines = [
    `# Catatan: ${meta.lessonTitle}`,
    "",
    `**Kelas:** ${meta.courseTitle}`,
    `**Diekspor:** ${(meta.exportedAt ?? new Date()).toLocaleString("id-ID")}`,
    "",
    "---",
    "",
  ];

  for (const note of sortedNotes(notes)) {
    lines.push(`## [${formatDuration(note.timestampSeconds)}]`);
    lines.push("");
    lines.push(toMarkdownBody(note.content) || "_(kosong)_");
    lines.push("");
  }

  return lines.join("\n");
}

/** Plain-text export — no markdown markers, suitable for Notepad / email. */
export function buildTxtExport(notes: LessonNote[], meta: NoteExportMeta) {
  const lines = [
    `Catatan: ${meta.lessonTitle}`,
    `Kelas: ${meta.courseTitle}`,
    `Diekspor: ${(meta.exportedAt ?? new Date()).toLocaleString("id-ID")}`,
    "",
    "----------------------------------------",
    "",
  ];

  for (const note of sortedNotes(notes)) {
    lines.push(`[${formatDuration(note.timestampSeconds)}]`);
    lines.push(stripHtml(note.content) || "(kosong)");
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Notion-friendly Markdown: YAML front matter + callout-style timestamps.
 * Import via Notion → Import → Markdown & CSV.
 */
export function buildNotionMarkdownExport(notes: LessonNote[], meta: NoteExportMeta) {
  const exportedAt = (meta.exportedAt ?? new Date()).toISOString();
  const lines = [
    "---",
    `title: "Catatan — ${meta.lessonTitle.replace(/"/g, "'")}"`,
    `course: "${meta.courseTitle.replace(/"/g, "'")}"`,
    `exported: ${exportedAt}`,
    "---",
    "",
    `# Catatan: ${meta.lessonTitle}`,
    "",
    `Kelas: ${meta.courseTitle}`,
    "",
  ];

  for (const note of sortedNotes(notes)) {
    const stamp = formatDuration(note.timestampSeconds);
    lines.push(`> ⏱ **${stamp}**`);
    lines.push("");
    lines.push(toMarkdownBody(note.content) || "_(kosong)_");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function docxRunsFromInlines(inlines: InlineNode[]) {
  const children: Array<TextRun | ExternalHyperlink> = [];
  for (const node of inlines) {
    if (node.type === "link") {
      children.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: node.text,
              bold: node.bold,
              italics: node.italic,
              underline: {},
              color: "4A4D7A",
              font: node.code ? "Consolas" : undefined,
              size: node.code ? 18 : 22,
            }),
          ],
          link: node.href,
        })
      );
      continue;
    }
    children.push(
      new TextRun({
        text: node.text,
        bold: node.bold,
        italics: node.italic,
        underline: node.underline ? {} : undefined,
        font: node.code ? "Consolas" : undefined,
        size: node.code ? 18 : 22,
      })
    );
  }
  return children;
}

function blocksToDocxParagraphs(blocks: BlockNode[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    if (block.type === "heading") {
      paragraphs.push(
        new Paragraph({
          heading:
            block.level === 1
              ? HeadingLevel.HEADING_1
              : block.level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3,
          children: docxRunsFromInlines(block.inlines),
          spacing: { before: 160, after: 80 },
        })
      );
      continue;
    }

    if (block.type === "blockquote") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: inlinesToPlain(block.inlines),
              italics: true,
              color: "6B6B75",
              size: 22,
            }),
          ],
          indent: { left: 360 },
          border: {
            left: { color: "DFE0E8", space: 8, style: "single", size: 12 },
          },
          spacing: { before: 80, after: 80 },
        })
      );
      continue;
    }

    if (block.type === "code-block") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              font: "Consolas",
              size: 18,
            }),
          ],
          shading: { type: "clear", fill: "F3F4F8" },
          spacing: { before: 80, after: 80 },
        })
      );
      continue;
    }

    if (block.type === "list-item") {
      const prefix = block.ordered ? `${block.index}. ` : "• ";
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: prefix, size: 22 }),
            ...docxRunsFromInlines(block.inlines),
          ],
          indent: { left: 360 },
          spacing: { before: 40, after: 40 },
        })
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        children: docxRunsFromInlines(block.inlines),
        spacing: { before: 60, after: 60 },
      })
    );
  }

  return paragraphs;
}

export async function buildDocxBlob(notes: LessonNote[], meta: NoteExportMeta) {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: `Catatan: ${meta.lessonTitle}`, bold: true, size: 32 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Kelas: ${meta.courseTitle} · Diekspor ${(meta.exportedAt ?? new Date()).toLocaleString("id-ID")}`,
          color: "6B6B75",
          size: 20,
        }),
      ],
      spacing: { after: 240 },
    }),
  ];

  const sorted = sortedNotes(notes);
  if (sorted.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Belum ada catatan.", italics: true })],
      })
    );
  }

  for (const note of sorted) {
    const stamp = formatDuration(note.timestampSeconds);
    children.push(
      new Paragraph({
        spacing: { before: 280, after: 120 },
        border: {
          top: { color: "DFE0E8", space: 12, style: "single", size: 6 },
        },
        children: [
          new TextRun({
            text: stamp,
            font: "Consolas",
            size: 18,
            bold: true,
          }),
        ],
      })
    );
    children.push(...blocksToDocxParagraphs(parseBlocks(note.content)));
  }

  const doc = new Document({
    creator: "Project Platform",
    title: `Catatan — ${meta.lessonTitle}`,
    description: `Catatan lesson dari kelas ${meta.courseTitle}`,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

function wrapText(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

export function buildPdfBlob(notes: LessonNote[], meta: NoteExportMeta) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (
    lines: string[],
    opts: { font?: "helvetica" | "courier"; style?: "normal" | "bold" | "italic"; size?: number; color?: [number, number, number]; gap?: number }
  ) => {
    const font = opts.font ?? "helvetica";
    const style = opts.style ?? "normal";
    const size = opts.size ?? 11;
    const color = opts.color ?? [30, 31, 38];
    const lineHeight = size * 1.35;
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += opts.gap ?? 4;
  };

  writeLines(wrapText(doc, `Catatan: ${meta.lessonTitle}`, maxWidth), {
    style: "bold",
    size: 18,
    gap: 6,
  });
  writeLines(
    wrapText(
      doc,
      `Kelas: ${meta.courseTitle} · Diekspor ${(meta.exportedAt ?? new Date()).toLocaleString("id-ID")}`,
      maxWidth
    ),
    { size: 10, color: [107, 107, 117], gap: 16 }
  );

  const sorted = sortedNotes(notes);
  if (sorted.length === 0) {
    writeLines(["Belum ada catatan."], { style: "italic", color: [107, 107, 117] });
  }

  for (const note of sorted) {
    ensureSpace(28);
    doc.setDrawColor(223, 224, 232);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    writeLines([`[${formatDuration(note.timestampSeconds)}]`], {
      font: "courier",
      style: "bold",
      size: 10,
      gap: 8,
    });

    const blocks = parseBlocks(note.content);
    if (blocks.length === 0) {
      writeLines(["(kosong)"], { style: "italic", color: [107, 107, 117] });
      continue;
    }

    for (const block of blocks) {
      if (block.type === "heading") {
        writeLines(wrapText(doc, inlinesToPlain(block.inlines), maxWidth), {
          style: "bold",
          size: block.level === 1 ? 14 : block.level === 2 ? 13 : 12,
          gap: 6,
        });
        continue;
      }
      if (block.type === "code-block") {
        writeLines(wrapText(doc, block.text, maxWidth), {
          font: "courier",
          size: 9,
          gap: 8,
        });
        continue;
      }
      if (block.type === "list-item") {
        const prefix = block.ordered ? `${block.index}. ` : "• ";
        writeLines(wrapText(doc, `${prefix}${inlinesToPlain(block.inlines)}`, maxWidth - 12), {
          size: 11,
          gap: 2,
        });
        continue;
      }
      if (block.type === "blockquote") {
        writeLines(wrapText(doc, inlinesToPlain(block.inlines), maxWidth - 16), {
          style: "italic",
          color: [107, 107, 117],
          gap: 6,
        });
        continue;
      }
      writeLines(wrapText(doc, inlinesToPlain(block.inlines) || " ", maxWidth), {
        size: 11,
        gap: 4,
      });
    }
    y += 8;
  }

  return doc.output("blob");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "catatan"
  );
}

export async function downloadNotesExport(
  notes: LessonNote[],
  meta: NoteExportMeta,
  format: NoteExportFormat
) {
  const base = `catatan-${slugify(meta.lessonTitle)}`;
  const exportedAt = new Date();
  const withDate = { ...meta, exportedAt };

  if (format === "md") {
    const content = buildMarkdownExport(notes, withDate);
    triggerDownload(new Blob([content], { type: "text/markdown;charset=utf-8" }), `${base}.md`);
    return;
  }

  if (format === "txt") {
    const content = buildTxtExport(notes, withDate);
    triggerDownload(new Blob([content], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
    return;
  }

  if (format === "notion") {
    // Notion Import accepts Markdown; front matter + callouts map cleanly.
    const content = buildNotionMarkdownExport(notes, withDate);
    triggerDownload(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
      `${base}-notion.md`
    );
    return;
  }

  if (format === "docx") {
    const blob = await buildDocxBlob(notes, withDate);
    triggerDownload(blob, `${base}.docx`);
    return;
  }

  if (format === "pdf") {
    const blob = buildPdfBlob(notes, withDate);
    triggerDownload(blob, `${base}.pdf`);
  }
}

export function noteHasVisibleContent(html: string) {
  return stripHtml(html).length > 0;
}
