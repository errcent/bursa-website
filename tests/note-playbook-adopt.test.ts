import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adoptBeliefSnippetToPlaybook } from "../src/lib/note/playbook/adopt-belief";
import { DEFAULT_SETUP_ID, defaultPlaybookState } from "../src/lib/note/playbook/defaults";

describe("Playbook adopt from Notes", () => {
  it("appends snippet to active setup condition", () => {
    const state = defaultPlaybookState();
    const next = adoptBeliefSnippetToPlaybook(state, "Wait for London open", "en");
    const setup = next.setups.find((s) => s.id === DEFAULT_SETUP_ID)!;
    assert.match(setup.condition.en, /From Notes: Wait for London open/);
  });

  it("does not duplicate identical snippet", () => {
    const state = defaultPlaybookState();
    const once = adoptBeliefSnippetToPlaybook(state, "No FOMO entries", "en");
    const twice = adoptBeliefSnippetToPlaybook(once, "No FOMO entries", "en");
    const setup = twice.setups.find((s) => s.id === DEFAULT_SETUP_ID)!;
    const matches = setup.condition.en.match(/No FOMO entries/g);
    assert.equal(matches?.length, 1);
  });
});
