function lowerLead(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/** Outcomes as one descriptive paragraph (paragraf 2 di About / hero). */
export function courseOutcomesDescriptionParagraph(outcomes: string[]): string {
  const items = outcomes.map((o) => o.trim().replace(/[.;]\s*$/, "")).filter(Boolean);
  if (items.length === 0) return "";

  const parts = items.map(lowerLead);
  if (parts.length === 1) {
    return `Setelah kelas ini, kamu akan ${parts[0]}.`;
  }
  if (parts.length === 2) {
    return `Setelah kelas ini, kamu akan ${parts[0]} dan ${parts[1]}.`;
  }
  const last = parts.pop()!;
  return `Setelah kelas ini, kamu akan ${parts.join(", ")}, dan ${last}.`;
}
