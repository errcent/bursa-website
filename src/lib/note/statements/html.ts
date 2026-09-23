/**
 * HTML table statement parsing (clean-room, zero dependencies).
 *
 * MetaTrader HTML reports render deals as plain <table> markup. This module
 * extracts tables → header + rows as text, with entity decoding for the
 * handful of entities brokers actually emit. No DOM dependency: runs
 * identically on server and edge runtimes.
 */

export interface HtmlTable {
  header: string[];
  rows: string[][];
}

/** Single-pass entity decode - avoids chained &amp; → & double-unescape (js/double-escaping). */
const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_full, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? "";
  });
  return decoded.replace(/\s+/g, " ").trim();
}

function stripTags(html: string): string {
  let text = html;
  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text.replace(/<[^>]*>/g, "");
  }
  return decodeEntities(text);
}

/** Extract every <table> as header + body rows of cell text. */
export function extractTables(html: string): HtmlTable[] {
  const tables: HtmlTable[] = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRe.exec(html)) !== null) {
    const body = tableMatch[1] ?? "";
    const rows: string[][] = [];
    const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(body)) !== null) {
      const cells: string[] = [];
      const cellRe = /<(td|th)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRe.exec(rowMatch[1] ?? "")) !== null) {
        cells.push(stripTags(cellMatch[2] ?? ""));
      }
      if (cells.some((c) => c !== "")) rows.push(cells);
    }
    if (rows.length >= 2) {
      const [header, ...rest] = rows as [string[], ...string[][]];
      tables.push({ header, rows: rest });
    }
  }
  return tables;
}

/** Pick the table whose header best matches the wanted columns. */
export function pickDealTable(
  tables: HtmlTable[],
  normalize: (header: string) => string | null,
  required: string[],
): HtmlTable | null {
  let best: HtmlTable | null = null;
  let bestScore = 0;
  for (const table of tables) {
    const keys = new Set(table.header.map(normalize).filter((k): k is string => !!k));
    const score = required.filter((r) => keys.has(r)).length;
    if (score > bestScore) {
      bestScore = score;
      best = table;
    }
  }
  return bestScore >= Math.min(required.length, 2) ? best : null;
}

/** Zip a table into keyed records using a header normalizer. */
export function tableRecords(
  table: HtmlTable,
  normalize: (header: string) => string | null,
): Record<string, string>[] {
  const keys = table.header.map(normalize);
  return table.rows.map((cells) => {
    const row: Record<string, string> = {};
    keys.forEach((key, i) => {
      if (key) row[key] = cells[i] ?? "";
    });
    return row;
  });
}

/** Quick sniff: does this look like an MT HTML statement at all? */
export function looksLikeMtStatement(html: string): boolean {
  const head = html.slice(0, 4000).toLowerCase();
  return (
    head.includes("<table") &&
    (head.includes("metatrader") || head.includes("metaquotes") || head.includes("deal"))
  );
}
