import type { NotePrefs } from "@/lib/note/prefs";

import { fxRatesFromPrefs } from "./rates";
import type { FxContext } from "./types";

export function fxContextFromPrefs(prefs: NotePrefs): FxContext {
  return {
    display: prefs.currency,
    rates: fxRatesFromPrefs(prefs),
  };
}
