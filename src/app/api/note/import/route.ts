import { NextRequest } from "next/server";

import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { enforceNoteRateLimit } from "@/lib/note/api-rate-limit";
import { applyNoteCors, noteCorsPreflight, requireNoteSession } from "@/lib/note/guard";
import {
  detectCsvGrain,
  detectStatementFormat,
  parseHtmlFills,
  parseJournalCsv,
  parseJournalFills,
  parseSectionFills,
} from "@/lib/note/csv";
import { JOURNAL_ACCOUNTS_BLOB, resolveAccount, type JournalAccount } from "@/lib/note/accounts";
import { JOURNAL_DEFAULTS_BLOB, normalizeDefaults } from "@/lib/note/defaults";
import { buildPositionCycles } from "@/lib/note/position/cycle";
import { cyclesToEntries } from "@/lib/note/position/adapter";
import type { Fill } from "@/lib/note/position/types";
import {
  IMPORT_HASHES_BLOB,
  IMPORT_HASHES_CAP,
  IMPORT_REVIEW_BLOB,
  IMPORT_REVIEW_CAP,
  dedupFills,
  fillHash,
  tradeRowHash,
  type ReviewItem,
} from "@/lib/note/statements/dedup";
import { isBodyTooLarge } from "@/lib/note/request-limits";
import { NOTE_IMPORT_BODY_MAX_BYTES } from "@/lib/note/resource-limits";
import { getNoteRepo } from "@/lib/note/repo";

export async function OPTIONS(request: NextRequest) {
  return noteCorsPreflight(request.headers.get("origin"));
}

async function loadHashes(apexUserId: string): Promise<Set<string>> {
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, IMPORT_HASHES_BLOB)) as unknown;
  return new Set(Array.isArray(raw) ? (raw as string[]) : []);
}

async function storeHashes(apexUserId: string, hashes: string[]): Promise<void> {
  const repo = getNoteRepo();
  await repo.setUserBlob(apexUserId, IMPORT_HASHES_BLOB, hashes.slice(-IMPORT_HASHES_CAP));
}

async function pushReview(apexUserId: string, items: ReviewItem[]): Promise<void> {
  if (items.length === 0) return;
  const repo = getNoteRepo();
  const raw = (await repo.getUserBlob(apexUserId, IMPORT_REVIEW_BLOB)) as unknown;
  const prev = Array.isArray(raw) ? (raw as ReviewItem[]) : [];
  await repo.setUserBlob(apexUserId, IMPORT_REVIEW_BLOB, [...prev, ...items].slice(-IMPORT_REVIEW_CAP));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const auth = await requireNoteSession(request, "note.write");
  if ("error" in auth) return applyNoteCors(auth.error, origin);

  const limited = await enforceNoteRateLimit(request, "journal_import", auth.session);
  if (!limited.ok) return applyNoteCors(limited.response, origin);

  if (isBodyTooLarge(request, NOTE_IMPORT_BODY_MAX_BYTES)) {
    return applyNoteCors(jsonError("File impor terlalu besar.", 413), origin);
  }

  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    let text = "";
    let accountLabel: string | null = null;
    if (file instanceof File) {
      text = await file.text();
      const labelField = form?.get("account");
      if (typeof labelField === "string" && labelField.trim()) accountLabel = labelField.trim();
    } else {
      const body = (await request.json().catch(() => null)) as { csv?: string; accountLabel?: string } | null;
      text = body?.csv ?? "";
      if (typeof body?.accountLabel === "string" && body.accountLabel.trim()) {
        accountLabel = body.accountLabel.trim().slice(0, 40);
      }
    }
    if (!text.trim()) {
      return applyNoteCors(jsonError("Lampirkan file CSV atau field csv.", 400), origin);
    }

    const repo = getNoteRepo();
    const accountRef = accountLabel ?? `import-${auth.session.userId.slice(0, 8)}`;
    const storedAccounts = ((await repo.getUserBlob(auth.session.userId, JOURNAL_ACCOUNTS_BLOB)) as unknown) as JournalAccount[] | null;
    const { method, pointValues: accountPoints } = resolveAccount(
      Array.isArray(storedAccounts) ? storedAccounts : [],
      accountLabel,
    );
    const defaults = normalizeDefaults(await repo.getUserBlob(auth.session.userId, JOURNAL_DEFAULTS_BLOB));
    const pointValues = { ...defaults.multipliers, ...accountPoints };
    const parseOpts = { accountRef, statementTz: defaults.statementTz, defaultFee: defaults.defaultFee };
    const writeOpts = { breakevenBand: defaults.breakevenBand };
    const known = await loadHashes(auth.session.userId);
    const newHashes: string[] = [];

    // Statement formats (HTML/MT, IBKR/ToS sections) → fills → cycles.
    const statement = detectStatementFormat(text);
    let fills: Fill[] = [];
    let parseErrors: string[] = [];
    if (statement === "html-mt") {
      const parsed = parseHtmlFills(text, parseOpts);
      fills = parsed.fills;
      parseErrors = parsed.errors;
    } else if (statement === "ibkr-section" || statement === "tos-section") {
      const parsed = parseSectionFills(text, statement, parseOpts);
      fills = parsed.fills;
      parseErrors = parsed.errors;
    } else if (detectCsvGrain(text) === "fills") {
      const parsed = parseJournalFills(text, parseOpts);
      fills = parsed.fills;
      parseErrors = parsed.errors;
    }

    if (fills.length > 0 || statement !== "generic" || detectCsvGrain(text) === "fills") {
      // Untimed fills go to the review queue — surfaced, never dropped silently.
      const timed = fills.filter((f) => !Number.isNaN(Date.parse(f.filledAt)));
      const untimed = fills.filter((f) => Number.isNaN(Date.parse(f.filledAt)));
      if (untimed.length > 0) {
        const now = new Date().toISOString();
        await pushReview(
          auth.session.userId,
          untimed.slice(0, 50).map((f, i) => ({
            ref: `${f.ticker} #${i + 1}`,
            reason: "missing-timestamp",
            detail: `${f.ticker} ${f.side} ${f.size} @ ${f.price} — tanpa waktu eksekusi valid.`,
            at: now,
          })),
        );
      }
      const { fresh, dupes } = dedupFills(timed, known);
      for (const f of fresh) newHashes.push(fillHash(f));
      if (fresh.length === 0) {
        await storeHashes(auth.session.userId, [...known]);
        return applyNoteCors(
          jsonOk({ imported: 0, fills: fills.length, dupes, untimed: untimed.length, errors: [...parseErrors, "Semua fill sudah pernah diimpor (dedup)."] }),
          origin,
        );
      }
      const cycles = buildPositionCycles(fresh, { method, pointValues });
      const inputs = cyclesToEntries(cycles);
      const created = [];
      for (const input of inputs) {
        created.push(await repo.createEntry(auth.session.userId, input, writeOpts));
      }
      await storeHashes(auth.session.userId, [...known, ...newHashes]);
      const warnings = [...parseErrors];
      const varianceFlags = cycles.filter((c) => Math.abs(c.grossVariance) >= 0.01).length;
      if (varianceFlags > 0) warnings.push(`${varianceFlags} siklus punya selisih vs statement — cek catatan entry.`);
      if (dupes > 0) warnings.push(`${dupes} fill duplikat dilewati.`);
      if (untimed.length > 0) warnings.push(`${untimed.length} fill tanpa waktu masuk antrean review.`);
      return applyNoteCors(
        jsonOk({ imported: created.length, fills: fills.length, dupes, untimed: untimed.length, cycles: cycles.length, errors: warnings, entries: created }),
        origin,
      );
    }

    // Trades grain: one row → one entry, with row-hash dedup across runs.
    const { entries, errors } = parseJournalCsv(text, parseOpts);
    if (entries.length === 0) {
      return applyNoteCors(jsonError(errors[0] ?? "Tidak ada baris yang bisa diimpor.", 400), origin);
    }
    const created = [];
    let dupes = 0;
    for (const input of entries) {
      const hash = tradeRowHash({
        symbol: input.symbol,
        side: input.side,
        qty: input.qty ?? null,
        entryPrice: input.entryPrice ?? null,
        exitPrice: input.exitPrice ?? null,
        pnl: input.pnl ?? null,
        openedAt: input.openedAt ?? null,
      });
      if (known.has(hash)) {
        dupes += 1;
        continue;
      }
      known.add(hash);
      newHashes.push(hash);
      created.push(await repo.createEntry(auth.session.userId, input, writeOpts));
    }
    await storeHashes(auth.session.userId, [...known]);
    const warnings = [...errors];
    if (dupes > 0) warnings.push(`${dupes} baris duplikat dilewati.`);
    return applyNoteCors(jsonOk({ imported: created.length, dupes, errors: warnings, entries: created }), origin);
  } catch (error) {
    if (error instanceof Error && error.message === "NOTE_JOURNAL_CAP") {
      return applyNoteCors(jsonError("Batas entry jurnal tercapai.", 413), origin);
    }
    return applyNoteCors(handleApiError(error), origin);
  }
}
