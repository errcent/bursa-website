import fs from "node:fs/promises";
import path from "node:path";

import type { DocumentPortal } from "@prisma/client";

import type { LegalLocale } from "@/lib/hosts/hosts";

import type { ParsedVaultDocument } from "./types";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "..");
const BUNDLED_ROOT = path.join(process.cwd(), "content/public-documents");
const VAULT_ROOT = path.join(
  WORKSPACE_ROOT,
  "Documentation/Legal/Publik"
);

/** Parse YAML-ish `key: value` frontmatter between `---` fences; return body. */
function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, content: match[2] };
}

function normalizePortal(value: string): DocumentPortal {
  const upper = value.toUpperCase();
  if (upper === "PRIVACY" || upper === "TRUST" || upper === "LEGAL") {
    return upper as DocumentPortal;
  }
  throw new Error(`Portal tidak valid: ${value}`);
}

/** Primary: bundled content (Vercel). Fallback: Obsidian vault (local monorepo). */
async function resolveContentRoot(): Promise<string> {
  try {
    await fs.access(BUNDLED_ROOT);
    return BUNDLED_ROOT;
  } catch {
    return VAULT_ROOT;
  }
}

export async function collectVaultMarkdownFiles(): Promise<string[]> {
  const root = await resolveContentRoot();
  const files: string[] = [];

  async function walk(dir: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (
        entry.name.endsWith(".md") &&
        !entry.name.startsWith("00 -") &&
        entry.name !== "README.md"
      ) {
        files.push(full);
      }
    }
  }

  await walk(root);
  return files.sort();
}

export function parseVaultFile(filePath: string, raw: string, contentRoot: string): ParsedVaultDocument | null {
  const { data, content } = parseFrontmatter(raw);
  const portalRaw = String(data.portal ?? "").trim();
  if (!portalRaw) return null;

  let portal: DocumentPortal;
  try {
    portal = normalizePortal(portalRaw);
  } catch {
    return null;
  }

  const slug = String(data.slug ?? "").trim();
  if (!slug) return null;

  const relPath = path.relative(contentRoot, filePath).replace(/\\/g, "/");
  const localeRaw = String(data.locale ?? "").trim().toLowerCase();
  const localeFromPath = /(?:^|\/)en\//.test(relPath) ? "en" : "id";
  const locale: LegalLocale = localeRaw === "en" || localeRaw === "id" ? localeRaw : localeFromPath;

  return {
    portal,
    slug,
    locale,
    title: String(data.title ?? slug),
    eyebrow: String(data.eyebrow ?? ""),
    description: String(data.description ?? ""),
    sortOrder: Number(data.sortOrder ?? 0),
    markdownBody: content.trim(),
    sourceVaultPath: relPath,
  };
}

export async function loadAllVaultDocuments(): Promise<ParsedVaultDocument[]> {
  const contentRoot = await resolveContentRoot();
  const files = await collectVaultMarkdownFiles();
  const docs: ParsedVaultDocument[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const parsed = parseVaultFile(file, raw, contentRoot);
    if (parsed) docs.push(parsed);
  }

  return docs.sort((a, b) => a.sortOrder - b.sortOrder);
}
