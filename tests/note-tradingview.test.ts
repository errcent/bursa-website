import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ECON_FILTER_CURRENCIES } from "../src/lib/note/economic-calendar/filters";
import { paneCountForLayout, reconcileChartPrefs } from "../src/lib/note/tradingview/chart-prefs";
import {
  currenciesForCharts,
  defaultSymbolForCurrency,
  isBroadCurrencyFilter,
  pairsForCurrency,
} from "../src/lib/note/tradingview/symbols";
import {
  buildAdvancedChartEmbedConfig,
  tradingViewSymbolPageUrl,
} from "../src/lib/note/tradingview/widget-config";

describe("TradingView symbol map", () => {
  it("returns pairs per currency", () => {
    assert.ok(pairsForCurrency("USD").some((p) => p.id.includes("EURUSD")));
    assert.ok(pairsForCurrency("JPY").some((p) => p.id.includes("USDJPY")));
  });

  it("defaults symbol for currency", () => {
    assert.equal(defaultSymbolForCurrency("EUR"), "FX:EURUSD");
  });

  it("detects broad filter", () => {
    assert.equal(isBroadCurrencyFilter([...ECON_FILTER_CURRENCIES]), true);
    assert.equal(isBroadCurrencyFilter(["USD", "EUR"]), false);
  });

  it("narrows chart currencies", () => {
    assert.deepEqual(currenciesForCharts(["USD", "EUR"]), ["USD", "EUR"]);
    assert.deepEqual(currenciesForCharts([...ECON_FILTER_CURRENCIES]), ["USD"]);
  });
});

describe("TradingView widget config", () => {
  it("builds embed JSON for advanced chart", () => {
    const cfg = buildAdvancedChartEmbedConfig("FX:EURUSD", "id");
    assert.equal(cfg.symbol, "FX:EURUSD");
    assert.equal(cfg.support_host, "https://www.tradingview.com");
    assert.equal(cfg.autosize, true);
  });

  it("maps symbol to chart page url", () => {
    assert.ok(tradingViewSymbolPageUrl("NASDAQ:AAPL").includes("NASDAQ-AAPL"));
  });
});

describe("Chart prefs reconcile", () => {
  it("maps two currencies to two panes in 2-col layout", () => {
    const prefs = reconcileChartPrefs(null, "2-col", ["USD", "EUR"]);
    assert.equal(paneCountForLayout(prefs.layout), 2);
    assert.equal(prefs.panes[0].currency, "USD");
    assert.equal(prefs.panes[1].currency, "EUR");
  });

  it("binds pane index to filter slot not free currency pick", () => {
    const prev = reconcileChartPrefs(null, "2-col", ["USD", "EUR"]);
    prev.panes[0].currency = "EUR";
    const next = reconcileChartPrefs(prev, "2-col", ["USD", "EUR"]);
    assert.equal(next.panes[0].currency, "USD");
  });

  it("keeps valid symbol when currency unchanged", () => {
    const prev = reconcileChartPrefs(null, "1", ["USD"]);
    prev.panes[0].symbol = "OANDA:XAUUSD";
    const next = reconcileChartPrefs(prev, "1", ["USD"]);
    assert.equal(next.panes[0].symbol, "OANDA:XAUUSD");
  });
});
