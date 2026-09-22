import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { signQuery } from "../src/lib/note/sync/binance";
import { keyHint, sealCredentials, unsealCredentials } from "../src/lib/note/sync/crypto";
import { parseFlexReference, parseFlexTrades } from "../src/lib/note/sync/ibkr-flex";

describe("broker sync", () => {
  it("signs Binance queries deterministically (HMAC-SHA256)", () => {
    const a = signQuery("symbol=BTCUSDT&timestamp=1", "secret");
    const b = signQuery("symbol=BTCUSDT&timestamp=1", "secret");
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.notEqual(a, signQuery("symbol=ETHUSDT&timestamp=1", "secret"));
  });

  it("seals and unseals credentials, masks hints", () => {
    const sealed = sealCredentials({ apiKey: "ABCDEFGH", apiSecret: "s3cr3t" });
    assert.ok(!sealed.includes("ABCDEFGH"));
    const open = unsealCredentials<Record<string, string>>(sealed);
    assert.equal(open?.apiKey, "ABCDEFGH");
    assert.equal(keyHint("ABCDEFGH"), "••••EFGH");
    assert.equal(unsealCredentials("not-an-envelope"), null);
  });

  it("parses Flex SendRequest references", () => {
    assert.equal(
      parseFlexReference("<Status>Success</Status><ReferenceCode>ABC123</ReferenceCode>"),
      "ABC123",
    );
    assert.equal(parseFlexReference("<Status>Fail</Status>"), null);
  });

  it("parses Flex Trade elements into fills, skipping malformed rows", () => {
    const xml = `<FlexStatements><Trades>
      <Trade symbol="AAPL" buySell="BUY" quantity="10" tradePrice="150" commission="1" dateTime="20260105;093100" transactionID="t1"/>
      <Trade symbol="AAPL" buySell="SELL" quantity="10" tradePrice="155" commission="1" dateTime="20260106;093100" transactionID="t2"/>
      <Trade symbol="BROKEN" buySell="HOLD" quantity="x" tradePrice="y" dateTime="nope"/>
    </Trades></FlexStatements>`;
    const { fills, skipped } = parseFlexTrades(xml, "ibkr");
    assert.equal(fills.length, 2);
    assert.equal(skipped, 1);
    assert.equal(fills[0]!.side, "buy");
    assert.equal(fills[1]!.side, "sell");
    assert.equal(fills[0]!.ticker, "AAPL");
    assert.ok(fills[0]!.filledAt.startsWith("2026-01-05"));
  });
});
