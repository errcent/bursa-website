/**
 * IBKR Flex Web Service sync (BYOK, read-only).
 *
 * Flow: SendRequest(token, queryId) → ReferenceCode → poll GetStatement →
 * Flex XML report → <Trade> elements → fills. No XML dependency: Trade
 * elements are self-closed with double-quoted attributes, extracted by
 * targeted regex. Anything ambiguous is skipped and counted, never guessed.
 */

import type { Fill } from "@/lib/note/position/types";
import type { BrokerFetchResult, IbkrFlexCredentials } from "./types";

const FLEX_HOST = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService";
const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 4000;
const FETCH_TIMEOUT_MS = 20_000;

async function flexGet(params: Record<string, string>): Promise<string> {
  const url = `${FLEX_HOST}/${params.endpoint}?${new URLSearchParams({ t: params.token ?? "", q: params.q ?? "", v: "3" }).toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Flex service rejected the request (HTTP ${res.status}).`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function tagText(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? (m[1] ?? "").trim() : null;
}

/** Pure: extract ReferenceCode from a SendRequest response. */
export function parseFlexReference(xml: string): string | null {
  if (tagText(xml, "Status") !== "Success") return null;
  const ref = tagText(xml, "ReferenceCode");
  return ref && ref.length > 0 ? ref : null;
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? (m[1] ?? null) : null;
}

function parseFlexDateTime(raw: string | null): string | null {
  if (!raw) return null;
  // Flex format: YYYYMMDD;HHmmss (America/New_York wall time in most queries)
  const m = raw.match(/^(\d{4})(\d{2})(\d{2});(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4]!, +m[5]!, +m[6]!)).toISOString();
  }
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** Pure: extract fills from <Trade .../> elements of a Flex report. */
export function parseFlexTrades(xml: string, accountRef: string): { fills: Fill[]; skipped: number } {
  const fills: Fill[] = [];
  let skipped = 0;
  const tags = xml.match(/<Trade\b[^>]*\/>/g) ?? [];
  tags.forEach((tag, index) => {
    const symbol = attr(tag, "symbol");
    const sideRaw = (attr(tag, "buySell") ?? "").toUpperCase();
    const qty = Number(attr(tag, "quantity"));
    const price = Number(attr(tag, "tradePrice"));
    const filledAt = parseFlexDateTime(attr(tag, "dateTime"));
    if (!symbol || (sideRaw !== "BUY" && sideRaw !== "SELL") || !Number.isFinite(qty) || qty === 0 || !Number.isFinite(price) || !filledAt) {
      skipped += 1;
      return;
    }
    const fee = Math.abs(Number(attr(tag, "commission") ?? 0));
    fills.push({
      id: `ibkr-${attr(tag, "transactionID") ?? `${filledAt}-${index}`}`,
      accountRef,
      ticker: symbol.toUpperCase(),
      side: sideRaw === "BUY" ? "buy" : "sell",
      size: Math.abs(qty),
      price,
      fee: Number.isFinite(fee) ? fee : 0,
      filledAt,
      origin: "sync",
      sequence: index,
    });
  });
  return { fills, skipped };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchIbkrFlexFills(
  creds: IbkrFlexCredentials,
  accountRef: string,
): Promise<BrokerFetchResult> {
  const errors: string[] = [];
  let reference: string | null = null;
  try {
    const sendXml = await flexGet({ endpoint: "SendRequest", token: creds.token, q: creds.queryId });
    reference = parseFlexReference(sendXml);
  } catch (error) {
    return { fills: [], skipped: 0, errors: [error instanceof Error ? error.message : "Flex request failed"] };
  }
  if (!reference) {
    return { fills: [], skipped: 0, errors: ["Flex query was not accepted. Check token and query ID."] };
  }
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    try {
      const statement = await flexGet({ endpoint: "GetStatement", token: creds.token, q: reference });
      if (/<Status>Fail<\/Status>/.test(statement)) {
        errors.push("Flex report is not ready yet.");
      } else if (statement.includes("<Trade")) {
        const { fills, skipped } = parseFlexTrades(statement, accountRef);
        return { fills, skipped, errors };
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Flex poll failed");
    }
    await sleep(POLL_DELAY_MS);
  }
  errors.push("Flex report was not ready after polling. Try again later.");
  return { fills: [], skipped: 0, errors };
}
