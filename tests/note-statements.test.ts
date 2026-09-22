import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectStatementFormat } from "../src/lib/note/csv";
import { extractTables, looksLikeMtStatement, pickDealTable } from "../src/lib/note/statements/html";
import { sliceHeadedBlock, sliceSections } from "../src/lib/note/statements/sections";
import { reconcileTrade } from "../src/lib/note/statements/reconcile";
import { dedupFills, fillHash, tradeRowHash } from "../src/lib/note/statements/dedup";
import type { Fill } from "../src/lib/note/position/types";

function fill(partial: Partial<Fill> & { id: string }): Fill {
  return {
    accountRef: "a",
    ticker: "EURUSD",
    side: "buy",
    size: 1,
    price: 1,
    fee: 0,
    filledAt: "2026-09-01T10:00:00.000Z",
    origin: "import",
    ...partial,
  };
}

const norm = (h: string) => {
  const k = h.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (k === "type" || k === "direction") return "side";
  if (k === "volume" || k === "lots" || k === "size") return "qty";
  if (k === "price" || k === "openprice") return "entryprice";
  return k || null;
};

describe("statement sections", () => {
  it("slices IBKR Trades header/data rows, drops totals", () => {
    const text = [
      "Trades,Header,Symbol,Buy/Sell,Quantity",
      "Trades,Data,AAPL,BUY,10",
      "Trades,Total,,,,",
    ].join("\n");
    const sections = sliceSections(text);
    assert.equal(sections.length, 1);
    assert.deepEqual(sections[0]!.header, ["Symbol", "Buy/Sell", "Quantity"]);
    assert.equal(sections[0]!.rows.length, 1);
  });

  it("slices a headed block until the blank line", () => {
    const text = ["Account Trade History", "Symbol,Side,Qty", "AAPL,BUY,10", "", "Other,Junk"].join("\n");
    const section = sliceHeadedBlock(text, "Account Trade History");
    assert.ok(section);
    assert.equal(section!.rows.length, 1);
  });
});

describe("statement html", () => {
  const html = `<html><body><p>MetaTrader 4 Statement</p><table>
    <tr><th>Symbol</th><th>Type</th><th>Volume</th><th>Price</th></tr>
    <tr><td>EURUSD</td><td>buy</td><td>0.1</td><td>1.0850</td></tr>
  </table></body></html>`;

  it("sniffs MT statements and extracts deal tables", () => {
    assert.equal(looksLikeMtStatement(html), true);
    const tables = extractTables(html);
    assert.equal(tables.length, 1);
    const deal = pickDealTable(tables, norm, ["symbol", "side", "qty"]);
    assert.ok(deal);
  });
});

describe("statement reconcile", () => {
  it("returns null inside the materiality floor", () => {
    assert.equal(reconcileTrade({ ref: "t", statedNet: 100, impliedGross: 100.005, fees: 0 }), null);
  });

  it("surfaces gaps with a suggested cause", () => {
    const item = reconcileTrade({ ref: "t", statedNet: 50, impliedGross: 100, fees: 2 })!;
    assert.ok(item);
    assert.equal(item.diff, -48);
    assert.ok(item.cause.length > 0);
  });
});

describe("statement dedup", () => {
  it("hashes fills deterministically and dedups repeats", () => {
    const a = fill({ id: "a" });
    const b = fill({ id: "b" });
    assert.equal(fillHash(a), fillHash(b));
    const { fresh, dupes } = dedupFills([a, b], new Set());
    assert.equal(fresh.length, 1);
    assert.equal(dupes, 1);
    const again = dedupFills([a], new Set([fillHash(a)]));
    assert.equal(again.fresh.length, 0);
  });

  it("hashes trade rows for idempotent re-imports", () => {
    const row = { symbol: "BBCA", side: "BUY", qty: 100, entryPrice: 7250, exitPrice: null, pnl: 50000, openedAt: "2026-09-20" };
    assert.equal(tradeRowHash(row), tradeRowHash({ ...row }));
  });
});

describe("statement detection order", () => {
  it("prefers Stockbit/Ajaib over generic, HTML over CSV", () => {
    assert.equal(detectStatementFormat("Saham,Aksi,Jumlah\nBBCA,BUY,100\n"), "stockbit");
    assert.equal(detectStatementFormat("Order ID,Symbol,Price\n1,AAPL,150\n"), "ajaib");
    assert.equal(detectStatementFormat("<html><table><tr><td>MetaTrader Deal</td></tr></table>"), "html-mt");
    assert.equal(detectStatementFormat("Trades,Header,Symbol\nTrades,Data,AAPL\n"), "ibkr-section");
    assert.equal(detectStatementFormat("symbol,side,qty\nEURUSD,BUY,1\n"), "generic");
  });
});
