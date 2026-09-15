import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatEventCountdown,
  pickNearestEvent,
} from "../src/lib/note/economic-calendar/countdown";
import { DEFAULT_ECON_FILTER, filterEventsByState } from "../src/lib/note/economic-calendar/filters";
import { ffDateToIso, parseForexFactoryXml } from "../src/lib/note/economic-calendar/parse-ff-xml";
import { parseForexFactoryJson } from "../src/lib/note/economic-calendar/parse-ff-json";
import type { EconomicEvent } from "../src/lib/note/economic-calendar/types";
import { volatilityCountdownConfig } from "../src/lib/note/economic-calendar/volatility-weight";
import { actualTone } from "../src/components/note/economic-calendar-table";

const SAMPLE = `<?xml version="1.0"?>
<weeklyevents>
  <event>
    <title>Test CPI</title>
    <country>USD</country>
    <date><![CDATA[09-15-2026]]></date>
    <time><![CDATA[8:30am]]></time>
    <impact><![CDATA[High]]></impact>
    <forecast><![CDATA[0.3%]]></forecast>
    <previous><![CDATA[0.2%]]></previous>
    <url><![CDATA[https://www.forexfactory.com/calendar/1-test]]></url>
  </event>
</weeklyevents>`;

function mockEvent(partial: Partial<EconomicEvent> & Pick<EconomicEvent, "title" | "date">): EconomicEvent {
  return {
    id: "x",
    currency: "USD",
    timeLabel: "8:30am",
    startsAt: partial.startsAt ?? `${partial.date}T12:30:00.000Z`,
    impact: "high",
    eventType: "inflation",
    forecast: null,
    previous: null,
    actual: null,
    url: null,
    source: "forexfactory_json",
    ...partial,
  };
}

describe("Forex Factory XML parser", () => {
  it("converts FF date to ISO", () => {
    assert.equal(ffDateToIso("09-15-2026"), "2026-09-15");
  });

  it("parses event blocks", () => {
    const rows = parseForexFactoryXml(SAMPLE);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "Test CPI");
    assert.equal(rows[0].impact, "high");
    assert.equal(rows[0].date, "2026-09-15");
    assert.ok(rows[0].startsAt);
    assert.match(rows[0].url ?? "", /forexfactory/);
  });
});

describe("Forex Factory JSON parser", () => {
  it("parses ISO timestamps", () => {
    const rows = parseForexFactoryJson([
      {
        title: "CPI m/m",
        country: "USD",
        date: "2026-09-15T08:30:00-04:00",
        impact: "High",
      },
    ]);
    assert.equal(rows[0].startsAt?.includes("2026-09-15"), true);
  });
});

describe("Economic calendar filters", () => {
  it("defaults to USD high impact", () => {
    assert.deepEqual(DEFAULT_ECON_FILTER.currencies, ["USD"]);
    assert.deepEqual(DEFAULT_ECON_FILTER.impacts, ["high"]);
  });

  it("filters by currency and impact", () => {
    const events: EconomicEvent[] = [
      mockEvent({ title: "A", date: "2026-09-15", impact: "high", currency: "USD" }),
      mockEvent({ title: "B", date: "2026-09-15", impact: "low", currency: "USD" }),
      mockEvent({ title: "C", date: "2026-09-15", impact: "high", currency: "EUR" }),
    ];
    const out = filterEventsByState(events, DEFAULT_ECON_FILTER);
    assert.equal(out.length, 1);
    assert.equal(out[0].title, "A");
  });
});

describe("Countdown phases", () => {
  it("shows hours/minutes when far", () => {
    const event = mockEvent({
      title: "NFP",
      date: "2026-09-15",
      startsAt: new Date(Date.now() + 90 * 60_000).toISOString(),
    });
    const view = formatEventCountdown(event, Date.now(), "en", true);
    assert.ok(view?.label.includes("in"));
    assert.equal(view?.phase, "mid");
  });

  it("uses 20m phase3 for heavy high impact", () => {
    const event = mockEvent({ title: "Core CPI m/m", date: "2026-09-15", impact: "high" });
    const cfg = volatilityCountdownConfig(event, true);
    assert.equal(cfg.phase3Ms, 20 * 60 * 1000);
  });

  it("never shows seconds for low impact when volatility aware", () => {
    const event = mockEvent({
      title: "Minor",
      date: "2026-09-15",
      impact: "low",
      startsAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    });
    const view = formatEventCountdown(event, Date.now(), "en", true);
    assert.equal(view?.phase, "mid");
    assert.match(view?.label ?? "", /in \d+m$/);
  });

  it("shows NOW after release", () => {
    const event = mockEvent({
      title: "CPI",
      date: "2026-09-15",
      startsAt: new Date(Date.now() - 90_000).toISOString(),
    });
    const view = formatEventCountdown(event, Date.now(), "en", true);
    assert.match(view?.label ?? "", /NOW/);
  });

  it("picks nearest upcoming event", () => {
    const now = Date.now();
    const events = [
      mockEvent({
        title: "past",
        date: "2026-09-14",
        startsAt: new Date(now - 3600_000).toISOString(),
      }),
      mockEvent({
        title: "next",
        date: "2026-09-15",
        startsAt: new Date(now + 600_000).toISOString(),
      }),
    ];
    const nearest = pickNearestEvent(events, now);
    assert.equal(nearest?.title, "next");
  });
});

describe("Economic calendar table", () => {
  it("colors actual vs forecast", () => {
    assert.equal(actualTone("0.4%", "0.3%"), "up");
    assert.equal(actualTone("0.2%", "0.3%"), "down");
    assert.equal(actualTone("", "0.3%"), null);
  });
});
