import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLINIC_MODULES,
  FREE_CLINIC_MODULE_ID,
  getClinicModule,
  isClinicModulePlusOnly,
} from "../src/lib/note/taxonomy";

describe("Bursa Note klinik taxonomy", () => {
  it("keeps eight v1 modules and no Plus locks in the habit phase", () => {
    assert.equal(CLINIC_MODULES.length, 8);
    assert.equal(CLINIC_MODULES.every((m) => !m.plusOnly), true);
    assert.equal(FREE_CLINIC_MODULE_ID, "setelah-rugi");
    assert.equal(isClinicModulePlusOnly(FREE_CLINIC_MODULE_ID), false);
    assert.equal(isClinicModulePlusOnly("overtrade"), false);
    assert.equal(getClinicModule("tidak-ada"), undefined);
  });

  it("every module has questions and a protocol", () => {
    for (const mod of CLINIC_MODULES) {
      assert.ok(mod.questions.length >= 4);
      assert.ok(mod.protocol.length > 10);
    }
  });
});
