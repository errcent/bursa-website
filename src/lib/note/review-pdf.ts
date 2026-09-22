import { jsPDF } from "jspdf";

/**
 * Review PDF export (client-side, $0).
 * Pure line builder (tested) + thin jsPDF writer.
 */

export interface ReviewPdfInput {
  locale: "id" | "en";
  generatedAt: string;
  weekNet: string;
  weekMeta: string;
  monthNet: string;
  monthMeta: string;
  mistake: string;
  adherence: string | null;
  edge: string | null;
}

export function buildReviewPdfLines(input: ReviewPdfInput): string[] {
  const en = input.locale === "en";
  const lines = [
    en ? "Bursa Note — Trading Review" : "Bursa Note — Review Trading",
    `${en ? "Generated" : "Dibuat"}: ${input.generatedAt}`,
    "",
    en ? "Last 7 days" : "7 hari terakhir",
    `${input.weekNet} · ${input.weekMeta}`,
    "",
    en ? "Last 31 days" : "31 hari terakhir",
    `${input.monthNet} · ${input.monthMeta}`,
    "",
    en ? "Mistake summary" : "Ringkasan mistake",
    input.mistake,
  ];
  if (input.adherence) {
    lines.push("", en ? "Adherence vs outcome" : "Kepatuhan vs hasil", input.adherence);
  }
  if (input.edge) {
    lines.push("", en ? "Edge" : "Edge", input.edge);
  }
  return lines;
}

export function saveReviewPdf(input: ReviewPdfInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 56;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const line of buildReviewPdfLines(input)) {
    const wrapped = line === "" ? [""] : doc.splitTextToSize(line, width);
    for (const part of wrapped as string[]) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(part, margin, y);
      y += 15;
    }
  }
  doc.save(`bursa-note-review-${input.generatedAt.slice(0, 10)}.pdf`);
}
