import { createBagasDefaultSchema, newRowId } from "./defaults";
import {
  idbGetSeedFlag,
  idbPutBlob,
  idbPutRows,
  idbPutSchema,
  idbSetSeedFlag,
  idbWipeAll,
} from "./idb";
import { parseTanggalToOpenedAt } from "./project";
import {
  RESERVED_PROP,
  type JournalDbRow,
  type JournalFileRef,
} from "./types";

const SEED_BASE = "/note-seed/bagas";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function decodeScreenshotName(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function normalizeCloseManual(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "yes") return "yes";
  if (t === "no") return "no";
  return t || "no";
}

function normalizeTpSl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const map: Record<string, string> = {
    "Full TP": "full_tp",
    TP: "tp",
    SL: "sl",
    "SL Plus": "sl_plus",
    BE: "be",
    Cancel: "cancel",
    "Cancel (SL)": "cancel_sl",
    "Harusnya full tp": "harusnya_full_tp",
  };
  return map[t] ?? t.toLowerCase().replace(/\s+/g, "_");
}

function inferSide(alasan: string, notes: string): string {
  const blob = `${alasan} ${notes}`.toLowerCase();
  if (/\(short\)|\bshort\b/.test(blob)) return "SELL";
  if (/\(long\)|\blong\b/.test(blob)) return "BUY";
  return "BUY";
}

async function fetchBlob(fileName: string): Promise<Blob | null> {
  try {
    const res = await fetch(`${SEED_BASE}/${encodeURIComponent(fileName)}`, { cache: "force-cache" });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

let seedInFlight: Promise<{ rows: number; seeded: boolean }> | null = null;

export async function ensureBagasSeed(force = false): Promise<{ rows: number; seeded: boolean }> {
  if (seedInFlight) {
    const pending = await seedInFlight;
    if (!force) return pending;
  }
  if (!force && (await idbGetSeedFlag())) {
    return { rows: 0, seeded: false };
  }

  seedInFlight = runBagasSeed();
  try {
    return await seedInFlight;
  } finally {
    seedInFlight = null;
  }
}

async function runBagasSeed(): Promise<{ rows: number; seeded: boolean }> {
  await idbWipeAll();

  const csvRes = await fetch(`${SEED_BASE}/recap.csv`, { cache: "no-store" });
  if (!csvRes.ok) throw new Error("Bagas seed CSV missing");
  const text = await csvRes.text();
  const table = parseCsv(text);
  if (table.length < 2) throw new Error("Bagas seed CSV empty");

  const header = table[0]!.map((h) => h.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);

  const iPair = idx("Pair");
  const iAlasan = idx("Alasan Entry");
  const iClose = idx("Close Manual");
  const iFear = idx("Fear & Greed");
  const iNotes = idx("Notes");
  const iRr = idx("R:R");
  const iShot = idx("Screenshot Chart");
  const iSetup = idx("Setup");
  const iTp = idx("TP/SL");
  const iTanggal = idx("Tanggal");
  const iConf = idx("Tingkat Kepercayaan (1-10)");
  const iCreated = idx("Created");

  const schema = createBagasDefaultSchema();
  const rows: JournalDbRow[] = [];

  for (let r = 1; r < table.length; r++) {
    const cols = table[r]!;
    const pair = (cols[iPair] ?? "").trim();
    if (!pair) continue;

    const alasan = (cols[iAlasan] ?? "").trim();
    const notes = (cols[iNotes] ?? "").trim();
    const tanggal = (cols[iTanggal] ?? "").trim();
    const createdRaw = (cols[iCreated] ?? "").trim();
    const openedAt = parseTanggalToOpenedAt(tanggal || createdRaw);
    const now = new Date().toISOString();
    // Stable id prevents Strict Mode / HMR double-seed duplicates.
    const id = `bagas_${r}_${pair.replace(/[^A-Za-z0-9]/g, "")}_${openedAt.slice(0, 10)}`;

    const files: JournalFileRef[] = [];
    const shotName = decodeScreenshotName(cols[iShot] ?? "");
    if (shotName) {
      const blob = await fetchBlob(shotName);
      if (blob) {
        const fileId = `seed_${id}_shot`;
        await idbPutBlob({
          id: fileId,
          blob,
          name: shotName,
          mime: blob.type || "image/png",
        });
        files.push({
          storage: "idb",
          id: fileId,
          name: shotName,
          mime: blob.type || "image/png",
          size: blob.size,
        });
      }
    }

    const rrRaw = (cols[iRr] ?? "").trim();
    const rr = rrRaw === "" ? null : Number(rrRaw);
    const fearRaw = (cols[iFear] ?? "").trim();
    const fear = fearRaw === "" ? null : Number(fearRaw);
    const confRaw = (cols[iConf] ?? "").trim();
    const conf = confRaw === "" ? null : Number(confRaw);

    rows.push({
      id,
      createdAt: openedAt,
      updatedAt: now,
      values: {
        [RESERVED_PROP.pair]: pair,
        [RESERVED_PROP.alasan]: alasan,
        [RESERVED_PROP.closeManual]: normalizeCloseManual(cols[iClose] ?? ""),
        [RESERVED_PROP.fearGreed]: Number.isFinite(fear as number) ? fear : null,
        [RESERVED_PROP.notes]: notes,
        [RESERVED_PROP.rr]: Number.isFinite(rr as number) ? rr : null,
        [RESERVED_PROP.screenshot]: files,
        [RESERVED_PROP.setup]: (cols[iSetup] ?? "").trim(),
        [RESERVED_PROP.tpSl]: normalizeTpSl(cols[iTp] ?? ""),
        [RESERVED_PROP.tanggal]: openedAt.slice(0, 10),
        [RESERVED_PROP.confidence]: Number.isFinite(conf as number) ? conf : null,
        [RESERVED_PROP.side]: inferSide(alasan, notes),
      },
    });
  }

  await idbPutSchema(schema);
  await idbPutRows(rows);
  await idbSetSeedFlag(true);
  return { rows: rows.length, seeded: true };
}
