import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergeTrackLocalAndServer, parseTrackStore } from "../src/lib/note/track/parse-store";
import {
  readServerTrackStore,
  resetServerTrackMemory,
  writeServerTrackStore,
} from "../src/lib/note/track/server-persistence";
import { NOTE_OPEN_ACCESS_GUEST_ID } from "../src/lib/note/open-access";
import { buildDemoTrackStore } from "../src/lib/note/track/demo-seed";

describe("Track local-first merge", () => {
  it("prefers local when it has portfolios", () => {
    const local = parseTrackStore({
      version: 1,
      portfolios: [{ id: "a", name: "Mine", createdAt: "2026-01-01" }],
      transactions: [],
    });
    const server = buildDemoTrackStore();
    const merged = mergeTrackLocalAndServer(local, server);
    assert.equal(merged.portfolios[0]?.name, "Mine");
  });

  it("falls back to server when local empty", () => {
    const local = parseTrackStore({ version: 1, portfolios: [], transactions: [] });
    const server = buildDemoTrackStore();
    const merged = mergeTrackLocalAndServer(local, server);
    assert.ok(merged.portfolios.length >= 2);
  });
});

describe("Track server persistence (memory)", () => {
  it("round-trips store for open-access guest id", async () => {
    resetServerTrackMemory();
    const demo = buildDemoTrackStore();
    await writeServerTrackStore(NOTE_OPEN_ACCESS_GUEST_ID, demo);
    const loaded = await readServerTrackStore(NOTE_OPEN_ACCESS_GUEST_ID);
    assert.equal(loaded.portfolios.length, demo.portfolios.length);
  });
});
