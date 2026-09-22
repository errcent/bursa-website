/**
 * Section-row statement parsing (clean-room).
 *
 * Some brokers emit multi-section CSV where data rows are prefixed by a
 * section tag instead of living under a single header row:
 * - IBKR activity: `Trades,Header,Symbol,Buy/Sell,...` then `Trades,Data,...`
 * - ThinkorSwim: an `Account Trade History` section block with its own header
 *
 * This module slices those blocks into plain record arrays. Column mapping
 * stays in the caller via header aliases.
 */

export interface StatementSection {
  tag: string;
  header: string[];
  rows: string[][];
}

function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/**
 * Split section-tagged rows: first cell is the section tag, second cell is
 * the row kind (Header/Data/Total). Returns sections keyed by tag with the
 * header row separated from data rows. Total rows are dropped.
 */
export function sliceSections(text: string): StatementSection[] {
  const sections = new Map<string, StatementSection>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const cells = splitRow(line);
    if (cells.length < 3) continue;
    const tag = cells[0]!;
    const kind = (cells[1] ?? "").toLowerCase();
    const rest = cells.slice(2);
    if (kind === "total") continue;
    let section = sections.get(tag);
    if (!section) {
      section = { tag, header: [], rows: [] };
      sections.set(tag, section);
    }
    if (kind === "header") section.header = rest;
    else if (kind === "data") section.rows.push(rest);
  }
  return [...sections.values()];
}

/**
 * Slice a headed block: rows between a start marker line and the next blank
 * line (or end), first row is the header. Used for ThinkorSwim-style blocks.
 */
export function sliceHeadedBlock(text: string, startMarker: string): StatementSection | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim().toLowerCase().startsWith(startMarker.toLowerCase()));
  if (start < 0) return null;
  const body: string[][] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]!.trim();
    if (!line) break;
    body.push(splitRow(lines[i]!));
  }
  if (body.length < 2) return null;
  const [header, ...rows] = body as [string[], ...string[][]];
  return { tag: startMarker, header, rows };
}

/** Zip a section into keyed records using a header normalizer. */
export function sectionRecords(
  section: StatementSection,
  normalize: (header: string) => string | null,
): Record<string, string>[] {
  const keys = section.header.map(normalize);
  return section.rows.map((cells) => {
    const row: Record<string, string> = {};
    keys.forEach((key, i) => {
      if (key) row[key] = cells[i] ?? "";
    });
    return row;
  });
}
